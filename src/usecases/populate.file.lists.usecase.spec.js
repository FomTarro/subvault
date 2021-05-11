const AppConfig = require('../../app.config').AppConfig;
const { JSDOM } = require('jsdom');
const logger = new AppConfig.LOGGER.Logger();
describe("Tests page building", () => {
    test("Builds home page", async() => {
        const req = {};
        const page = await AppConfig.POPULATE_FILE_LISTS.execute(logger, req);
        const dom = new JSDOM(page);
        expect(dom.window.document.getElementById('list').firstElementChild.parentNode.children.length).toBeGreaterThanOrEqual(1);
    });

    test("Builds list page", async() => {
        const req = {};
        const page = await AppConfig.POPULATE_FILE_LISTS.execute(logger, req, 'bonbombs');
        const dom = new JSDOM(page);
        expect(dom.window.document.getElementById('list').firstElementChild.parentNode.children.length).toBeGreaterThanOrEqual(1);
    });
});