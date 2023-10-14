export const getEmailLink = (email) => {
    const domain = email.split("@")[1];

    switch (domain) {
        case "gmail.com":
            return "https://mail.google.com";
        case "yahoo.com":
            return "https://mail.yahoo.com";
        case "outlook.com":
            return "https://outlook.live.com";
        case "hotmail.com":
            return "https://outlook.live.com";
        case "aol.com":
            return "https://mail.aol.com";
        case "zoho.com":
            return "https://www.zoho.com/mail/";
        case "mail.com":
            return "https://www.mail.com/int/";
        case "yandex.com":
            return "https://mail.yandex.com/";
        case "163.com":
            return "https://mail.163.com/";
        // 添加更多的邮件提供商...
        default:
            return ``;
    }

};
