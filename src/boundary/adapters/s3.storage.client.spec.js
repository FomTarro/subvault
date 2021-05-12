const AppConfig = require('../../../app.config').AppConfig;

describe("Tests S3 Storage client", () => {
    test("Properly joins file paths", async() => {
        var filePath = AppConfig.S3_CLIENT.joinPathForS3('bonbombs', 'file.txt');
        expect(filePath).toBe('bonbombs/file.txt');
        filePath = AppConfig.S3_CLIENT.joinPathForS3('bonbombs', 'nested', 'file.txt');
        expect(filePath).toBe('bonbombs/nested/file.txt');
    });

    test("gets Broadcaster folders", async() => {
        const logger = new AppConfig.LOGGER.Logger({});
        var broadcasters = await AppConfig.S3_CLIENT.getBroadcasterFolderList(logger)
        expect(broadcasters.length).toBeGreaterThanOrEqual(1);
    });

    test("gets known test file", async() => {
        const logger = new AppConfig.LOGGER.Logger({});
        var file = await AppConfig.S3_CLIENT.getFileByPath(logger, 'fomtarro/gingam.png');
        expect(file.ContentLength).toBeGreaterThanOrEqual(1);
    });

});