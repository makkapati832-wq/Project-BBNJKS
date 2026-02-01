const request = require("supertest");
const app = require("../server");
const db = require("./db_setup");
const User = require("../models/User");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");

let token;

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

const setupData = async () => {
    // 1. Register Teacher via API (So password gets hashed)
    await request(app).post("/api/auth/register").send({
        name: "Teacher",
        email: "t@t.com",
        password: "123", // Controller hashes this
        role: "teacher"
    });
    
    // Login to get token
    const loginRes = await request(app).post("/api/auth/login").send({ 
        email: "t@t.com", 
        password: "123" 
    });
    
    // Check if login worked before proceeding
    if (!loginRes.body.user) {
        throw new Error("Login failed in setupData: " + JSON.stringify(loginRes.body));
    }
    
    token = loginRes.body.user.token;
    const teacherId = loginRes.body.user.id;

    // 2. Create Students (Direct DB create is fine here as we don't need them to login)
    const s1 = await User.create({ name: "S1", email: "s1@t.com", password: "123", role: "student" });
    await User.create({ name: "S2", email: "s2@t.com", password: "123", role: "student" });

    // 3. Create Class & Session
    const cls = await Class.create({ className: "CS", classCode: "CS1", teacherId: teacherId });
    const session = await Session.create({ sessionName: "L1", createdBy: "T", classId: cls._id, teacherId: teacherId });

    // 4. Create Attendance
    await Attendance.create({ studentId: s1._id, sessionId: session._id });
};

describe("Analytics API", () => {
    // Run setup before every test
    beforeEach(setupData);

    it("GET /stats - should return dashboard counts", async () => {
        const res = await request(app)
            .get("/api/analytics/stats")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        // We created 2 students
        expect(res.body.studentCount).toBe(2);
        // We created 1 class
        expect(res.body.classCount).toBe(1);
        // We created 1 attendance record
        expect(res.body.recentActivity.length).toBe(1);
    });

    it("GET /stats - should fail without token", async () => {
        const res = await request(app).get("/api/analytics/stats");
        expect(res.statusCode).toBe(401);
    });
});