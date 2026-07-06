export const NativeRouter = {

    login: (accessToken: string, refreshToken: string, source?: string) => {
        // `source` (e.g. "guide") lets the app return the user to wherever login was
        // started from instead of always opening Settings after sign-in.
        let url = `enconvo://login?access_token=${accessToken}&refresh_token=${refreshToken}`;
        if (source) {
            url += `&source=${encodeURIComponent(source)}`;
        }
        window.location.href = url;
    },

    install: (name: string, title: string, downloadUrl: string) => {
        window.location.href = `enconvo://install?name=${name}&title=${title}&downloadUrl=${downloadUrl}`;
    }
};
