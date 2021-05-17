const AppConfig = require('../../app.config').AppConfig;

describe("Tests File Utils", () => {
    test("Removes unacceptable characters", async() => {
        const string = "A poorly Formatted_$tring.png"
        expect(AppConfig.FILE_UTILS.makeFileNameSafe(string)).toBe("A_poorly_Formatted__tring.png");
    });

    test("Errors gracefully with no string", async() => {
        const string = undefined
        expect(AppConfig.FILE_UTILS.makeFileNameSafe(string)).toBe("");
    });

    test("no conversion needed", async() => {
        const bytes = 128;
        expect(AppConfig.FILE_UTILS.bytesToFileSizeString(bytes)).toBe("128b");
    });
    test("converts bytes to kilobytes", async() => {
        const bytes = 2350;
        expect(AppConfig.FILE_UTILS.bytesToFileSizeString(bytes)).toBe("2.35kb");
    });
    test("converts bytes to megabytes", async() => {
        const bytes = 1600000;
        expect(AppConfig.FILE_UTILS.bytesToFileSizeString(bytes)).toBe("1.60mb");
    });
    test("converts bytes to gigabytes", async() => {
        const bytes = 4650000000;
        expect(AppConfig.FILE_UTILS.bytesToFileSizeString(bytes)).toBe("4.65gb");
    });
});