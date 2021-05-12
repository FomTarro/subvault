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
});