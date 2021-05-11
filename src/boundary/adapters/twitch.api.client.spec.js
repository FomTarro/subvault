const AppConfig = require('../../../app.config').AppConfig;

describe("Tests twitch API", () => {
    test("Errors gracefully with bad token", async() => {
        const logger = new AppConfig.LOGGER.Logger();
        const isSub = await AppConfig.TWITCH_CLIENT.getUserSub(logger, 49902129, 49902129, "badtoken")
        expect(isSub).toBeFalsy();
    });

    test("Tom's ID is fetched", async() => {
        const logger = new AppConfig.LOGGER.Logger();
        const id = await AppConfig.TWITCH_CLIENT.getUserInfo(logger, 'fomtarro');
        expect(id.id).toBe('49902129');
    });
});