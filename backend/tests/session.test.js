const request = require("supertest");
const app = require("../server");
const db = require("./db_setup");
const Class = require("../models/Class");
const User = require("../models/User");

let teacherId, classId, sessionId;

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

const setupData = async () => {
    const teacher = await User.create({ name: "T", email: "t@t.com", password: "123", role: "teacher" });
    teacherId = teacher._id;
    const cls = await Class.create({ className: "CS", classCode: "CS50", teacherId });
    classId = cls._id;
};

describe("Session API", () => {
    beforeEach(async () => {
        await setupData();
        // Create a default session
        const res = await request(app).post("/api/sessions/create").send({
            sessionName: "Lec 1", createdBy: "T", classId, teacherId
        });
        sessionId = res.body.session._id;
    });

    it("POST /create - should create session with QR", async () => {
        const res = await request(app).post("/api/sessions/create").send({
            sessionName: "Lec 2", createdBy: "T", classId, teacherId
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.session.qrCode).toBeDefined();
    });

    it("POST /validate - should validate correct QR", async () => {
        const res = await request(app).post("/api/sessions/validate").send({ sessionId });
        expect(res.statusCode).toBe(200);
        expect(res.body.valid).toBe(true);
    });

    it("GET / - should get all sessions", async () => {
        const res = await request(app).get("/api/sessions");
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it("GET /class/:classId - should get sessions for a class", async () => {
        const res = await request(app).get(`/api/sessions/class/${classId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
    });
});
