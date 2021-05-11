const AppConfig = require('../../app.config').AppConfig;

describe("Tests Session Utils", () => {
    test("Errors gracefully with bad token", async() => {
        const req = {};
        expect(AppConfig.SESSION_UTILS.hasUserSession(req)).toBeFalsy();
        req.session = {};
        expect(AppConfig.SESSION_UTILS.hasUserSession(req)).toBeFalsy();
        req.session.passport = {};
        expect(AppConfig.SESSION_UTILS.hasUserSession(req)).toBeFalsy();
        req.session.passport.user = { name: 'howdy' };
        expect(AppConfig.SESSION_UTILS.hasUserSession(req)).toBeTruthy();
    });
});