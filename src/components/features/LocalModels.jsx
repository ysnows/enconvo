import { CubeIcon } from "@radix-ui/react-icons"

export function LocalModels() {
    return (
        <div className="flex text-white font-mono sm:mt-60 mt-6 flex-col sm:flex-row lg:flex-row">
            <div className="pr-20 mt-16 flex flex-col"
                style={{
                    flexGrow: 0.6,
                    flexBasis: 0,
                    flexShrink: 1,
                }}>
                <div className="bg-gradient-to-l from-blue-800 to-cyan-300 w-14 h-14 flex items-center justify-center rounded-xl">
                    <CubeIcon />
                </div>

                <p className="font-bold text-4xl mt-6">
                    <span className="bg-gradient-to-tr from-blue-800 to-cyan-300 text-transparent bg-clip-text">
                        Local
                    </span> Models
                </p>
                <p className="mt-6">
                    Chat with every model supported locally by Ollama. Take advantage of all the powerful plugins 
                    offered by Enconvo in a private and secure manner.
                </p>
            </div>

            <div className="flex-1 mt-6 sm:mt-0">
                <video className="mt-16 basis-0 rounded-xl bg-white/5 w-full shadow-2xl ring-1 ring-white/10 sm:mt-24" 
                    controls autoPlay muted>
                    <source src="https://file.enconvo.com/usecases/chat_with_local_models.mp4" type="video/mp4" />
                </video>
            </div>
        </div>
    )
}
