const AppConfig = require('../../../app.config').AppConfig;

describe("Tests ID fetching", () => {
    test("Tom's ID is fetched", async() => {
        const logger = new AppConfig.LOGGER.Logger();
        const id = await AppConfig.USER_ID_CLIENT.getUserInfo(logger, 'fomtarro');
        expect(id.id).toBe('49902129');
    });
});