import { FileTextIcon } from "@radix-ui/react-icons"

export function ChatWithDocument() {
    return (
        <div className="flex text-white font-mono sm:mt-60 mt-6 flex-col sm:flex-row lg:flex-row">
            <div className="pr-20 mt-16 flex flex-col"
                style={{
                    flexGrow: 0.6,
                    flexBasis: 0,
                    flexShrink: 1,
                }}>
                <div className="bg-gradient-to-l from-purple-800 to-cyan-300 w-14 h-14 flex items-center justify-center rounded-xl">
                    <FileTextIcon />
                </div>

                <p className="font-bold text-4xl mt-6">
                    <span className="bg-gradient-to-tr from-purple-800 to-cyan-300 text-transparent bg-clip-text">
                        Chat
                    </span> With Document
                </p>
                <p className="mt-6">
                    Easily and elegantly drag and drop to interact with your document.
                </p>
            </div>

            <div className="flex-1 mt-6 sm:mt-0">
                <video className="mt-16 basis-0 rounded-xl bg-white/5 w-full shadow-2xl ring-1 ring-white/10 sm:mt-24" 
                    controls autoPlay muted>
                    <source src="https://file.enconvo.com/usecases/chat_with_doc.mp4" type="video/mp4" />
                </video>
            </div>
        </div>
    )
}
