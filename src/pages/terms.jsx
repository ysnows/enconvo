import {CheckCircleIcon, InformationCircleIcon} from '@heroicons/react/20/solid'
import Link from "next/link";

export default function Privacy() {
    return (
        <div className="bg-white px-6 py-32 lg:px-8">
            <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                <p className="mb-8 text-base font-semibold leading-7 text-indigo-600">_______________________</p>


                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Terms of Use</h1>
                <p className="mt-6 text-xl leading-8">
                    Thank you for using Enconvo. Your support motivates us to improve this product.
                </p>
                <div className="mt-10 max-w-2xl">
                    <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Pricing
                        strategy</h2>
                    <p className="mt-6">
                        Enconvo Basic version is free to use, but with limited functionality.
                    </p>
                    <p className="mt-6">
                        Enconvo Pro version requires payment, and after purchasing the Pro version,
                        you can use all functions without any limitations. The payment plan is a
                        lifetime buyout, and you only need to pay once to use it permanently.
                    </p>
                    <p className="mt-6">
                        We offer a <span className="font-bold">14-day free trial</span> for you to experience the Pro version, and you
                        can decide whether to purchase it after the trial.
                    </p>


                </div>
                <div className="mt-16 max-w-2xl">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Refund</h2>
                    <p className="mt-6">If you have such thoughts, we are sorry, so please prioritize contacting us to resolve your dissatisfaction, but we always respect your choice. </p>
                    <p className="mt-8">However, the refund process of the application is not controlled by the developer, so we suggest that you contact Apple support team to handle the refund. You can find <a className={"text-indigo-600"} href="https://support.apple.com/zh-cn/HT204084">relevant information here</a> in a new window.</p>


                </div>
                <div className="mt-16 max-w-2xl">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Changes to this
                        Privacy Policy</h2>
                    <p className="mt-6">
                        We may update our privacy policy from time to time to adapt to the latest
                        situation of Enconvo. Therefore, we recommend that you regularly check this
                        page for the latest content.

                        <br/>
                        We will notify you of any changes by posting a new privacy policy on this
                        page. All changes take effect immediately after being posted on this page.
                    </p>


                </div>
                <div className="mt-16 max-w-2xl">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Contact Us</h2>
                    <p className="mt-6">
                        If you have any questions or suggestions about our terms of use , please
                        contact us at: &nbsp; <Link className="text-indigo-600"
                                                    href={'mailto:support@enconvo.com.com'}>support@enconvo.com.com</Link>
                    </p>


                </div>
            </div>
        </div>
    )
}
