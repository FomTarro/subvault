const AppConfig = require('../../../app.config').AppConfig;

describe("Tests S3 Storage client", () => {
    test("Properly joins file paths", async() => {
        var filePath = AppConfig.S3_CLIENT.joinPathForS3('bonbombs', 'file.txt');
        expect(filePath).toBe('bonbombs/file.txt');
        filePath = AppConfig.S3_CLIENT.joinPathForS3('bonbombs', 'nested', 'file.txt');
        expect(filePath).toBe('bonbombs/nested/file.txt');
    });

    test("Properly identifies file owner", async() => {
        var owner = AppConfig.S3_CLIENT.getFileOwner('fomtarro/file.txt')
        expect(owner).toBe('fomtarro');
        owner = AppConfig.S3_CLIENT.getFileOwner('fomtarro/nested/file.txt');
        expect(owner).toBe('fomtarro');
    });

    test("gets Broadcaster folders", async() => {
        const logger = new AppConfig.LOGGER.Logger({});
        var broadcasters = await AppConfig.S3_CLIENT.getBroadcasterFolderList(logger)
        expect(broadcasters.length).toBeGreaterThanOrEqual(1);
    });

    test("gets filtered Broadcaster folders", async() => {
        const logger = new AppConfig.LOGGER.Logger({});
        const input = ["fomtarro", "bonbombs"]
        var broadcasters = await AppConfig.S3_CLIENT.getFilteredBroadcasterFolderList(logger, "fom")
        expect(broadcasters).toEqual(input)
    });

    test("gets known test file", async() => {
        const logger = new AppConfig.LOGGER.Logger({});
        var file = await AppConfig.S3_CLIENT.getFileByPath(logger, 'fomtarro/blush.png');
        expect(file.ContentLength).toBeGreaterThanOrEqual(1);
    });

});