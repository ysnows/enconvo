import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const source = await readFile(new URL('../src/lib/auth-flow.ts', import.meta.url), 'utf8')
const module = { exports: {} }
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module, module.exports)
const { authFlowHref, isCompanionFlow } = module.exports
assert.equal(isCompanionFlow({ source: ['companion', 'desktop'] }), true)
assert.equal(isCompanionFlow({ source: 'desktop' }), false)
const query = { from: 'app', source: 'companion', handoff: 'a+b&c', language: 'zh-CN', returnUrl: '/account?a=b', access_token: 'secret', irrelevant: 'omit' }
for (const path of ['/login', '/register', '/reset_password_send']) {
  const url = new URL(authFlowHref(path, query), 'https://enconvo.com')
  assert.equal(url.pathname, path)
  for (const key of ['from', 'source', 'handoff', 'language', 'returnUrl']) assert.equal(url.searchParams.get(key), query[key])
  assert.equal(url.searchParams.has('access_token'), false)
  assert.equal(url.searchParams.has('irrelevant'), false)
}
assert.equal(authFlowHref('/login', {}), '/login')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
let router = { isReady: true, query: { source: 'companion' } }
async function loadForm(name) {
  const source = await readFile(new URL(`../src/pages/components/${name}.tsx`, import.meta.url), 'utf8')
  const module = { exports: {} }
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const passthrough = ({ children }) => React.createElement('div', {}, children)
  const mocks = {
    'next/router': { useRouter: () => router },
    'next/head': { default: passthrough, __esModule: true },
    'next/link': { default: passthrough, __esModule: true },
    '@/i18n/I18nProvider': { useI18n: () => ({ t: s => s, locale: 'en' }) },
    '@/i18n/server': { i18nStaticProps: () => ({}) },
    '@/components/ui/input': { Input: ({type, name, placeholder}) => React.createElement('input', {type, name, placeholder}) },
    '@/lib/auth-flow': { authFlowHref, isCompanionFlow },
    '@supabase/auth-helpers-nextjs': { createClientComponentClient: () => ({ auth: {} }) },
  }
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] ?? (name.startsWith('@/') ? new Proxy({}, { get: () => passthrough }) : require(name)), module, module.exports)
  return module.exports.default
}
for (const name of ['LoginForm', 'RegisterForm']) {
  const Form = await loadForm(name)
  for (const state of [{ isReady: false, query: {} }, { isReady: true, query: { source: 'companion' } }, { isReady: true, query: { source: 'desktop' } }]) {
    router = state
    const html = renderToStaticMarkup(React.createElement(Form, { loginState: '', setLoginState() {}, setUser() {}, email: '', setEmail() {} }))
    assert.equal(html.includes('Continue with Google') || html.includes('Sign in with Google') || html.includes('Sign up with Google'), state.isReady && state.query.source !== 'companion', `${name} Google availability`)
    assert.match(html, /email/i)
  }
}
console.log('PASS: iPhone email-only auth, desktop Google auth, SSR readiness, native return navigation and token omission')
