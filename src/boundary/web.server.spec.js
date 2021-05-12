const request = require("supertest");
const AppConfig = require('../../app.config').AppConfig;

describe("App Context Launches", () => {
    test("Respond 200 when GET on root", async() => {
        const response = await request(await AppConfig.WEB_SERVER()).get("/");
        expect(response.statusCode).toBe(200);
    });

    test("Respond 200 when GET on upload", async() => {
        const response = await request(await AppConfig.WEB_SERVER()).get("/upload");
        expect(response.statusCode).toBe(200);
    });

    test("Respond 200 when GET on known broadcaster", async() => {
        const response = await request(await AppConfig.WEB_SERVER()).get("/broadcasters/fomtarro");
        expect(response.statusCode).toBe(200);
    });

    test("Respond 200 when GET on known broadcaster", async() => {
        const response = await request(await AppConfig.WEB_SERVER()).get("/broadcasters/who???");
        expect(response.statusCode).toBe(200);
    });

    test("Respond 404 when GET on unknown URL", async() => {
        const response = await request(await AppConfig.WEB_SERVER()).get("/a-fake-url");
        expect(response.statusCode).toBe(404);
    });

    test("Respond 403 Denied when GET on Upload with no dession", async() => {
        const response = await request(await AppConfig.WEB_SERVER()).post("/upload");
        expect(response.statusCode).toBe(403);
    });
})