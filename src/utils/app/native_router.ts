export const NativeRouter = {

    login: (accessToken: string, refreshToken: string) => {
        window.location.href = `enconvo://login?access_token=${accessToken}&refresh_token=${refreshToken}`;

    },

    install: (name: string, title: string, downloadUrl: string) => {
        window.location.href = `enconvo://install?name=${name}&title=${title}&downloadUrl=${downloadUrl}`;
    }
};
