const request = require("supertest");
const app = require("../server");
const db = require("./db_setup");
const User = require("../models/User");
const Class = require("../models/Class");
const Session = require("../models/Session");

let studentId, sessionId;

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

const setupData = async () => {
    const teacher = await User.create({ name: "T", email: "t@t.com", password: "123", role: "teacher" });
    const student = await User.create({ name: "S", email: "s@s.com", password: "123", role: "student" });
    studentId = student._id;

    const cls = await Class.create({ className: "CS", classCode: "CS50", teacherId: teacher._id });
    const session = await Session.create({ sessionName: "L1", createdBy: "T", classId: cls._id, teacherId: teacher._id });
    sessionId = session._id;
};

describe("Attendance API", () => {
    beforeEach(setupData);

    it("POST /mark - should mark attendance", async () => {
        const res = await request(app).post("/api/attendance/mark").send({
            studentId, sessionId, timestamp: Date.now()
        });
        expect(res.statusCode).toBe(201);
    });

    it("POST /mark - should reject duplicate attendance", async () => {
        await request(app).post("/api/attendance/mark").send({ studentId, sessionId, timestamp: Date.now() });
        
        const res = await request(app).post("/api/attendance/mark").send({ studentId, sessionId, timestamp: Date.now() });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/already/i);
    });

    it("GET /:sessionId - should return list of attendees", async () => {
        await request(app).post("/api/attendance/mark").send({ studentId, sessionId, timestamp: Date.now() });

        const res = await request(app).get(`/api/attendance/${sessionId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].studentEmail).toBe("s@s.com");
    });
});
