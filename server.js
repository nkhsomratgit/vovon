const express = require("express");
const multer = require("multer");
const session = require("express-session");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// FOLDERS
// ===============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ===============================
// DATABASE
// ===============================

const db = new Database("ashik-vovon.db");

db.exec(`
CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT DEFAULT 'আশিক ভবন',
    audio TEXT NOT NULL,
    cover TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    image TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "ashik-vovon-change-this-secret",

        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax"
        }
    })
);

// ===============================
// STATIC FILES
// ===============================

app.use("/uploads", express.static(uploadDir));

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// ===============================
// FILE UPLOAD
// ===============================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

        const ext =
            path.extname(file.originalname);

        const filename =
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8) +
            ext;

        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,

    limits: {
        fileSize: 100 * 1024 * 1024
    }
});

// ===============================
// ADMIN LOGIN
// ===============================

app.post("/api/login", (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    const adminUser =
        process.env.ADMIN_USER || "admin";

    const adminPass =
        process.env.ADMIN_PASS ||
        "change-this-password";

    if (
        username === adminUser &&
        password === adminPass
    ) {

        req.session.admin = true;

        return res.json({
            success: true,
            message: "Login successful"
        });
    }

    res.status(401).json({
        success: false,
        message: "Username or password ভুল"
    });
});

// ===============================
// LOGOUT
// ===============================

app.post("/api/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({
            success: true
        });

    });

});

// ===============================
// ADMIN SECURITY
// ===============================

function adminOnly(req, res, next) {

    if (!req.session.admin) {

        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });

    }

    next();
}

// ===============================
// GET SONGS
// ===============================

app.get("/api/songs", (req, res) => {

    const songs = db
        .prepare(`
            SELECT *
            FROM songs
            ORDER BY id DESC
        `)
        .all();

    res.json(songs);
});

// ===============================
// GET PHOTOS
// ===============================

app.get("/api/photos", (req, res) => {

    const photos = db
        .prepare(`
            SELECT *
            FROM photos
            ORDER BY id DESC
        `)
        .all();

    res.json(photos);
});

// ===============================
// ADD SONG
// ===============================

app.post(
    "/api/songs",

    adminOnly,

    upload.fields([
        {
            name: "audio",
            maxCount: 1
        },
        {
            name: "cover",
            maxCount: 1
        }
    ]),

    (req, res) => {

        if (
            !req.files ||
            !req.files.audio ||
            !req.files.audio[0]
        ) {

            return res.status(400).json({
                success: false,
                message: "Audio file required"
            });

        }

        const title =
            req.body.title?.trim();

        if (!title) {

            return res.status(400).json({
                success: false,
                message: "Song title required"
            });

        }

        const audio =
            "/uploads/" +
            req.files.audio[0].filename;

        let cover = null;

        if (
            req.files.cover &&
            req.files.cover[0]
        ) {

            cover =
                "/uploads/" +
                req.files.cover[0].filename;
        }

        const result =
            db.prepare(`
                INSERT INTO songs
                (
                    title,
                    artist,
                    audio,
                    cover
                )
                VALUES (?, ?, ?, ?)
            `)
            .run(
                title,
                req.body.artist ||
                    "আশিক ভবন",
                audio,
                cover
            );

        res.json({
            success: true,
            id: result.lastInsertRowid
        });

    }
);

// ===============================
// DELETE SONG
// ===============================

app.delete(
    "/api/songs/:id",

    adminOnly,

    (req, res) => {

        const song =
            db.prepare(
                "SELECT * FROM songs WHERE id = ?"
            )
            .get(req.params.id);

        if (!song) {

            return res.status(404).json({
                success: false,
                message: "Song not found"
            });

        }

        deleteUpload(song.audio);
        deleteUpload(song.cover);

        db.prepare(
            "DELETE FROM songs WHERE id = ?"
        )
        .run(req.params.id);

        res.json({
            success: true
        });

    }
);

// ===============================
// ADD PHOTO
// ===============================

app.post(
    "/api/photos",

    adminOnly,

    upload.single("image"),

    (req, res) => {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Image required"
            });

        }

        const image =
            "/uploads/" +
            req.file.filename;

        const result =
            db.prepare(`
                INSERT INTO photos
                (
                    title,
                    image
                )
                VALUES (?, ?)
            `)
            .run(
                req.body.title || "",
                image
            );

        res.json({
            success: true,
            id: result.lastInsertRowid
        });

    }
);

// ===============================
// DELETE PHOTO
// ===============================

app.delete(
    "/api/photos/:id",

    adminOnly,

    (req, res) => {

        const photo =
            db.prepare(
                "SELECT * FROM photos WHERE id = ?"
            )
            .get(req.params.id);

        if (!photo) {

            return res.status(404).json({
                success: false,
                message: "Photo not found"
            });

        }

        deleteUpload(photo.image);

        db.prepare(
            "DELETE FROM photos WHERE id = ?"
        )
        .run(req.params.id);

        res.json({
            success: true
        });

    }
);

// ===============================
// DELETE UPLOADED FILE
// ===============================

function deleteUpload(url) {

    if (!url) return;

    const filename =
        path.basename(url);

    const file =
        path.join(
            uploadDir,
            filename
        );

    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
}

// ===============================
// ADMIN PANEL
// ===============================

app.get("/admin", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "admin",
            "index.html"
        )
    );

});

// ===============================
// SERVER
// ===============================

app.listen(PORT, () => {

    console.log(
        `Ashik Vovon Server running on port ${PORT}`
    );

});