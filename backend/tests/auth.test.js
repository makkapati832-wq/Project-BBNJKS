const request = require("supertest");
const app = require("../server");
const db = require("./db_setup");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe("Auth API", () => {
    
    // 1. Register
    it("POST /register - should register a new user", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Test User", email: "test@test.com", password: "123", role: "student"
        });
        expect(res.statusCode).toBe(201);
    });

    // 2. Login
    it("POST /login - should return token on success", async () => {
        await request(app).post("/api/auth/register").send({
            name: "Login User", email: "login@test.com", password: "123", role: "teacher"
        });

        const res = await request(app).post("/api/auth/login").send({
            email: "login@test.com", password: "123"
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.user).toHaveProperty("token");
    });

    // 3. Get Profile
    it("GET /profile/:id - should fetch user details", async () => {
        // Register & Login to get ID
        await request(app).post("/api/auth/register").send({
            name: "Profile User", email: "profile@test.com", password: "123", role: "student"
        });
        const loginRes = await request(app).post("/api/auth/login").send({
            email: "profile@test.com", password: "123"
        });
        const userId = loginRes.body.user.id;

        const res = await request(app).get(`/api/auth/profile/${userId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe("profile@test.com");
    });

    // 4. Update Profile (Image Upload)
    it("POST /upload-avatar - should upload image and update profile", async () => {
        // Setup User
        await request(app).post("/api/auth/register").send({
            name: "Upload User", email: "upload@test.com", password: "123", role: "student"
        });
        const loginRes = await request(app).post("/api/auth/login").send({
            email: "upload@test.com", password: "123"
        });
        const userId = loginRes.body.user.id;

        // Create a dummy buffer to simulate an image file
        const buffer = Buffer.from("fake-image-content");

        const res = await request(app)
            .post("/api/auth/upload-avatar")
            .field("userId", userId) // Add body field
            .attach("profileImage", buffer, "test-avatar.jpg"); // Attach file

        expect(res.statusCode).toBe(200);
        
        // FIX: Check if the returned URL contains the new filename format
        // Expected format: .../uploads/profileImage-<timestamp>.jpg
        expect(res.body.imageUrl).toMatch(/profileImage-\d+\.jpg/);
    });
});
