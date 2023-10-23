import {CheckCircleIcon, InformationCircleIcon} from '@heroicons/react/20/solid'
import Link from "next/link";

export default function Downloads() {
    return (
        <div className="bg-white px-6 py-32 lg:px-8">
            <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                <p className="mb-8 text-base font-semibold leading-7 text-indigo-600">_______________________</p>


                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Privacy
                    Policy</h1>
                <p className="mt-6 text-xl leading-8">
                    Enconvo is an intelligent conversation tool software for macOS platform, mainly
                    completing quick conversation needs through integrating third-party artificial
                    intelligence services.

                    This privacy policy mainly applies to the Enconvo main program and the
                    integrated frameworks and services, and does not apply to Enconvo plugins
                    installed by yourself.
                </p>
                <div className="mt-10 max-w-2xl">
                    <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Privacy
                        permissions</h2>
                    <p className="mt-6">
                        To ensure the normal operation of the program, the following privacy
                        permissions need to be enabled for Enconvo:
                    </p>

                    <ul role="list" className="mt-8 max-w-xl space-y-8 text-gray-600">
                        <li className="flex gap-x-3">
                            <CheckCircleIcon className="mt-1 h-5 w-5 flex-none text-indigo-600"
                                             aria-hidden="true"/>
                            <span>
                <strong className="font-semibold text-gray-900">Accessibility permission. </strong> Obtain the currently selected text through accessibility permission, which is used to implement functions related to word translation. Enconvo will only request this permission when you use the relevant functions.
              </span>
                        </li>
                        <li className="flex gap-x-3">
                            <CheckCircleIcon className="mt-1 h-5 w-5 flex-none text-indigo-600"
                                             aria-hidden="true"/>
                            <span>
                <strong className="font-semibold text-gray-900">Clipboard read and write. </strong> Obtain the currently selected text through the clipboard, or write specified text to the clipboard.
              </span>
                        </li>
                    </ul>

                    <p className="mt-10">
                        We will not save or share any data obtained through the above permissions.
                    </p>
                </div>
                <div className="mt-16 max-w-2xl">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Collected
                        data.</h2>
                    <p className="mt-6">
                        Enconvo does not collect core data generated during your usage, such as
                        translated text and recognized images. If you enable services that require
                        network requests, Enconvo may send data over the network to the service
                        provider server for data processing to obtain the required results.
                    </p>
                    <p className="mt-8">
                        In addition, when you use certain service provider services, you may need
                        to enter your own key into the Enconvo main program to use them normally.
                        Enconvo only saves your key locally and does not upload it to the server.
                        <br/> However, to provide a better user experience, Enconvo may collect the
                        following data:
                    </p>

                    <ul role="list" className="mt-8 max-w-xl space-y-8 text-gray-600">

                        <li className="flex gap-x-3">
                            <CheckCircleIcon className="mt-1 h-5 w-5 flex-none text-indigo-600"
                                             aria-hidden="true"/>
                            <span>
                <strong className="font-semibold text-gray-900">Crash data. </strong> To improve program stability, we collect information on program crashes.
              </span>
                        </li>
                    </ul>

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
                        If you have any questions or suggestions about our privacy policy, please
                        contact us at: &nbsp; <Link className="text-indigo-600"
                                                    href={'mailto:yong531315@gmail.com'}>yong531315@gmail.com</Link>
                    </p>


                </div>
            </div>
        </div>
    )
}
