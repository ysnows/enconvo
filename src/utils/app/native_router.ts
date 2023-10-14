export const NativeRouter = {

    login: (accessToken: string, refreshToken: string) => {
        window.location.href = `enconvo://login?access_token=${accessToken}&refresh_token=${refreshToken}`;

    }
};
