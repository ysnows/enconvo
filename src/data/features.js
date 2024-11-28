import writing from '@/images/features/writing.gif'
import plugin from '@/images/features/plugin.gif'
import { ArchiveIcon, Component1Icon, CubeIcon, EyeOpenIcon, FileTextIcon, ImageIcon, MixIcon, CardStackIcon } from "@radix-ui/react-icons"

export const features = [
  {
    id: 'seamless-access',
    title: 'Seamless Access',
    titleGradient: 'from-red-300 to-blue-800',
    description: 'The only entrance point that provides access to your prompts and tools anywhere and anytime, ensuring convenience and efficiency in managing your tasks and resources.',
    icon: {
      component: 'svg',
      gradient: 'from-red-500 to-blue-900',
      path: 'M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z'
    },
    media: {
      type: 'image',
      src: writing
    }
  },
  {
    id: 'plugin-system',
    title: 'Plugin System',
    titleGradient: 'from-cyan-950 to-emerald-200',
    description: 'With the plugin system, you can easily add new features to your system, and If you are a developer, you can easily create your own plugin and share it with others.',
    icon: {
      component: 'svg',
      gradient: 'from-cyan-950 to-emerald-200',
      path: 'M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z'
    },
    media: {
      type: 'image',
      src: plugin
    }
  },
  {
    id: 'vision-chat',
    title: 'Vision Chat',
    titleGradient: 'from-blue-700 to-emerald-200',
    description: 'You can chat using images on your device or select a screenshot from any position on your screen. This feature is powered by OpenAI.',
    icon: {
      component: EyeOpenIcon,
      gradient: 'from-blue-700 to-emerald-200'
    },
    media: {
      type: 'video',
      src: 'https://file.enconvo.com/usecases/vision_chat.mp4'
    }
  },
  {
    id: 'image-generation',
    title: 'Image Generation',
    titleGradient: 'from-violet-600 to-emerald-200',
    description: 'Generate images from your text, and use it in productive way.',
    icon: {
      component: ImageIcon,
      gradient: 'from-violet-600 to-emerald-200'
    },
    media: {
      type: 'video',
      src: 'https://file.enconvo.com/usecases/image_generation.mp4'
    }
  },
  {
    id: 'chat-with-document',
    title: 'Chat With Document',
    titleGradient: 'from-purple-800 to-cyan-300',
    description: 'Easily and elegantly drag and drop to interact with your document.',
    icon: {
      component: FileTextIcon,
      gradient: 'from-purple-800 to-cyan-300'
    },
    media: {
      type: 'video',
      src: 'https://file.enconvo.com/usecases/chat_with_doc.mp4'
    }
  },
  {
    id: 'popbar',
    title: 'PopBar',
    titleGradient: 'from-yellow-800 to-cyan-300',
    description: 'With Popbar, you can conveniently interact with any selected text in any software on your MacOS.',
    icon: {
      component: Component1Icon,
      gradient: 'from-yellow-800 to-cyan-300'
    },
    media: {
      type: 'video',
      src: 'https://file.enconvo.com/usecases/popbar.mp4'
    }
  },
  {
    id: 'local-models',
    title: 'Local Models',
    titleGradient: 'from-blue-800 to-cyan-300',
    description: 'Chat with every model supported locally by Ollama. Take advantage of all the powerful plugins offered by Enconvo in a private and secure manner.',
    icon: {
      component: CubeIcon,
      gradient: 'from-blue-800 to-cyan-300'
    },
    media: {
      type: 'video',
      src: 'https://file.enconvo.com/usecases/chat_with_local_models.mp4'
    }
  },
  {
    id: 'compress-images',
    title: 'Compress Images',
    titleGradient: 'from-green-800 to-cyan-300',
    description: 'Easily compress images in a chat-like manner, powered by TinyPNG.',
    icon: {
      component: ArchiveIcon,
      gradient: 'from-green-800 to-cyan-300'
    },
    media: {
      type: 'video',
      src: 'https://file.enconvo.com/usecases/tinypng.mp4'
    }
  },
  {
    id: 'translate-engines',
    title: 'Translate Engines',
    titleGradient: 'from-indigo-800 to-cyan-300',
    description: 'Translate text easily with the power of OpenAI, DeepL, and Google Translate. More to come.',
    icon: {
      component: MixIcon,
      gradient: 'from-indigo-800 to-cyan-300'
    },
    media: {
      type: 'video',
      src: 'https://file.enconvo.com/usecases/translate.mp4'
    }
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    titleGradient: 'from-red-600 to-cyan-300',
    description: 'You can now create your knowledge base from multipul files',
    icon: {
      component: CardStackIcon,
      gradient: 'from-red-600 to-cyan-300'
    },
    media: {
      type: 'video',
      src: 'https://file.enconvo.com/usecases/knowledge_base.mp4'
    }
  }
]
