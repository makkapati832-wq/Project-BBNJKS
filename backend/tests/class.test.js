const request = require("supertest");
const app = require("../server");
const db = require("./db_setup");

let token, teacherId, classId;

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

// Helper: Login as Teacher
const loginTeacher = async () => {
    await request(app).post("/api/auth/register").send({
        name: "Teacher", email: "t@test.com", password: "123", role: "teacher"
    });
    const res = await request(app).post("/api/auth/login").send({
        email: "t@test.com", password: "123"
    });
    token = res.body.user.token;
    teacherId = res.body.user.id;
};

describe("Class API", () => {
    beforeEach(async () => {
        await loginTeacher();
        // Create a default class for tests
        const res = await request(app)
            .post("/api/classes")
            .set("Authorization", `Bearer ${token}`)
            .send({ className: "Math", classCode: "M101", teacherId, description: "Intro" });
        classId = res.body.class._id;
    });

    it("POST / - should create a new class", async () => {
        const res = await request(app)
            .post("/api/classes")
            .set("Authorization", `Bearer ${token}`)
            .send({ className: "Science", classCode: "S101", teacherId, description: "Lab" });
        expect(res.statusCode).toBe(201);
    });

    it("GET / - should get all classes (with search)", async () => {
        const res = await request(app).get("/api/classes?search=Math");
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].classCode).toBe("M101");
    });

    it("GET /teacher/:id - should get teacher specific classes", async () => {
        const res = await request(app)
            .get(`/api/classes/teacher/${teacherId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it("PUT /:id - should update class", async () => {
        const res = await request(app)
            .put(`/api/classes/${classId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ className: "Advanced Math" });
        expect(res.statusCode).toBe(200);
        expect(res.body.class.className).toBe("Advanced Math");
    });

    it("DELETE /:id - should delete class", async () => {
        const res = await request(app)
            .delete(`/api/classes/${classId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        
        // Verify it's gone
        const check = await request(app).get("/api/classes");
        expect(check.body.length).toBe(0);
    });
});
