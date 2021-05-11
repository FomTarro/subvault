const AppConfig = require('../../../app.config').AppConfig;

describe("Tests Subscriber Checking", () => {
    test("Errors gracefully with bad token", async() => {
        const logger = new AppConfig.LOGGER.Logger();
        const isSub = await AppConfig.USER_SUB_CLIENT.getUserSub(logger, 49902129, 49902129, "badtoken")
        expect(isSub).toBeFalsy();
    });
});