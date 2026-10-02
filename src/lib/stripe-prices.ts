// The Stripe price behind each plan the website sells, by the lookup key its buttons send.

export const PRICE_IDS: Record<string, string> = {
    standard: 'price_1QVP9VP5mwiRKlICCifMKEDK',
    premium: 'price_1QVPBWP5mwiRKlICa2MFNaR7',

    // Teams lifetime license (ADR 0036): base covers 5 seats; extra seats ride the
    // seat add-on price with quantity. `teams_seat` alone grows an existing license.
    teams: 'price_1Tu3LuP5mwiRKlICy3h6oU6y',
    teams_seat: 'price_1Tu2BSP5mwiRKlICmmKspOSI',

    monthly: 'price_1PUnZ5P5mwiRKlICwO3oKaJZ',
    yearly: 'price_1PUnbcP5mwiRKlICBAdbINOS',
    // Cloud tiers Pro/Max (ADR 0034)
    pro_monthly: 'price_1TtzpnP5mwiRKlICF1zwDrRO',
    pro_yearly: 'price_1TtzpxP5mwiRKlIC2O3cX0rd',
    max_monthly: 'price_1TtzqDP5mwiRKlICEj5Nkmun',
    max_yearly: 'price_1TtzqPP5mwiRKlIC3lNm6g81',
    '250000_points': 'price_1Qx9GDP5mwiRKlICDn53Og5c',
    '1500000_points': 'price_1Qx9NTP5mwiRKlIC8vIK1Ym1',
    '3000000_points': 'price_1Qx9QYP5mwiRKlICzdVj9Nx3',
}
