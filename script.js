 	// 1. Mengambil elemen HTML
        const canvas = document.getElementById("game");
        const ctx = canvas.getContext("2d");

        const hpText = document.getElementById("hp");
        const skorText = document.getElementById("skor");
        const levelText = document.getElementById("level");
        const pesan = document.getElementById("pesan");

        // 2. Variabel pemain
        let pemain;
        let zombie = [];
        let peluru = [];

        let skor = 0;
        let level = 1;
        let berjalan = false;
        let dijeda = false;

        let tombol = {};
        let mouse = {
            x: 400,
            y: 250
        };

        let waktuZombie = 0;
        let waktuTembak = 0;
        let animasiID;

        // 3. Memulai atau mengulang permainan
        function mulaiGame() {
            cancelAnimationFrame(animasiID);

            pemain = {
                x: 400,
                y: 250,
                ukuran: 15,
                kecepatan: 4,
                hp: 100
            };

            zombie = [];
            peluru = [];

            skor = 0;
            level = 1;
            waktuZombie = 0;
            waktuTembak = 0;

            berjalan = true;
            dijeda = false;

            pesan.textContent = "Bertahan hidup!";
            perbaruiInfo();

            animasi();
        }

        // 4. Menggambar pemain
        function gambarPemain() {
            ctx.save();

            ctx.translate(pemain.x, pemain.y);

            // Mengarahkan senjata ke mouse
            let sudut = Math.atan2(
                mouse.y - pemain.y,
                mouse.x - pemain.x
            );

            ctx.rotate(sudut);

            // Senjata
            ctx.fillStyle = "#dddddd";
            ctx.fillRect(0, -4, 25, 8);

            // Tubuh pemain
            ctx.fillStyle = "#62b879";
            ctx.beginPath();
            ctx.arc(0, 0, pemain.ukuran, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // 5. Membuat zombie baru
        function buatZombie() {
            let sisi = Math.floor(Math.random() * 4);
            let x, y;

            if (sisi === 0) {
                x = Math.random() * canvas.width;
                y = 0;
            } else if (sisi === 1) {
                x = canvas.width;
                y = Math.random() * canvas.height;
            } else if (sisi === 2) {
                x = Math.random() * canvas.width;
                y = canvas.height;
            } else {
                x = 0;
                y = Math.random() * canvas.height;
            }

            zombie.push({
                x: x,
                y: y,
                ukuran: 14,
                hp: 1,
                kecepatan: 1 + level * 0.15
            });
        }

        // 6. Menggambar zombie
        function gambarZombie(z) {
            ctx.fillStyle = "#77a65e";

            ctx.beginPath();
            ctx.arc(
                z.x,
                z.y,
                z.ukuran,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Mata zombie
            ctx.fillStyle = "#243323";

            ctx.beginPath();
            ctx.arc(z.x - 5, z.y - 3, 2, 0, Math.PI * 2);
            ctx.arc(z.x + 5, z.y - 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 7. Membuat peluru
        function tembak() {
            if (!berjalan || dijeda) return;

            let dx = mouse.x - pemain.x;
            let dy = mouse.y - pemain.y;

            let jarak = Math.hypot(dx, dy);

            if (jarak === 0) return;

            peluru.push({
                x: pemain.x,
                y: pemain.y,
                vx: (dx / jarak) * 8,
                vy: (dy / jarak) * 8
            });
        }

        // 8. Menggambar peluru
        function gambarPeluru(b) {
            ctx.fillStyle = "#ffe08a";

            ctx.beginPath();
            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 9. Menggerakkan pemain
        function gerakPemain() {
            if (tombol["w"] || tombol["arrowup"]) {
                pemain.y -= pemain.kecepatan;
            }

            if (tombol["s"] || tombol["arrowdown"]) {
                pemain.y += pemain.kecepatan;
            }

            if (tombol["a"] || tombol["arrowleft"]) {
                pemain.x -= pemain.kecepatan;
            }

            if (tombol["d"] || tombol["arrowright"]) {
                pemain.x += pemain.kecepatan;
            }

            // Pemain tidak boleh keluar arena
            pemain.x = Math.max(
                pemain.ukuran,
                Math.min(canvas.width - pemain.ukuran, pemain.x)
            );

            pemain.y = Math.max(
                pemain.ukuran,
                Math.min(canvas.height - pemain.ukuran, pemain.y)
            );
        }

        // 10. Menggerakkan zombie mengejar pemain
        function gerakZombie() {
            zombie.forEach(function(z) {
                let dx = pemain.x - z.x;
                let dy = pemain.y - z.y;

                let jarak = Math.hypot(dx, dy);

                if (jarak > 0) {
                    z.x += (dx / jarak) * z.kecepatan;
                    z.y += (dy / jarak) * z.kecepatan;
                }

                // Zombie menyentuh pemain
                if (jarak < z.ukuran + pemain.ukuran) {
                    pemain.hp -= 0.3;
                }
            });
        }

        // 11. Menggerakkan peluru
        function gerakPeluru() {
            peluru.forEach(function(b) {
                b.x += b.vx;
                b.y += b.vy;
            });

            // Menghapus peluru yang keluar arena
            peluru = peluru.filter(function(b) {
                return (
                    b.x >= 0 &&
                    b.x <= canvas.width &&
                    b.y >= 0 &&
                    b.y <= canvas.height
                );
            });
        }

        // 12. Memeriksa tabrakan peluru dan zombie
        function periksaTabrakan() {
            peluru.forEach(function(b) {
                zombie.forEach(function(z) {
                    let jarak = Math.hypot(
                        b.x - z.x,
                        b.y - z.y
                    );

                    if (jarak < z.ukuran + 5 && z.hp > 0) {
                        z.hp = 0;
                        b.x = -100;
                        skor += 10;
                    }
                });
            });

            // Menghapus zombie yang sudah terkena peluru
            zombie = zombie.filter(function(z) {
                return z.hp > 0;
            });
        }

        // 13. Memperbarui informasi permainan
        function perbaruiInfo() {
            hpText.textContent = Math.max(0, Math.ceil(pemain.hp));
            skorText.textContent = skor;
            levelText.textContent = level;
        }

        // 14. Mengakhiri permainan
        function gameOver() {
            berjalan = false;

            pesan.textContent =
                "GAME OVER! Skor akhir kamu: " + skor;

            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#ff6961";
            ctx.font = "bold 42px Arial";
            ctx.textAlign = "center";

            ctx.fillText(
                "GAME OVER",
                canvas.width / 2,
                canvas.height / 2
            );

            ctx.font = "22px Arial";

            ctx.fillText(
                "Skor: " + skor,
                canvas.width / 2,
                canvas.height / 2 + 40
            );
        }

        // 15. Fungsi utama permainan
        function animasi() {
            if (!berjalan || dijeda) return;

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            gerakPemain();

            waktuZombie++;

            // Zombie muncul secara berkala
            if (waktuZombie > Math.max(20, 75 - level * 5)) {
                buatZombie();
                waktuZombie = 0;
            }

            gerakZombie();
            gerakPeluru();
            periksaTabrakan();

            gambarPemain();

            zombie.forEach(gambarZombie);
            peluru.forEach(gambarPeluru);

            // Level meningkat setiap 100 poin
            level = Math.floor(skor / 100) + 1;

            perbaruiInfo();

            if (pemain.hp <= 0) {
                pemain.hp = 0;
                perbaruiInfo();
                gameOver();
                return;
            }

            animasiID = requestAnimationFrame(animasi);
        }

        // 16. Mengatur tombol keyboard
        document.addEventListener("keydown", function(e) {
            tombol[e.key.toLowerCase()] = true;

            if (
                ["arrowup", "arrowdown", "arrowleft", "arrowright"]
                .includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
            }
        });

        document.addEventListener("keyup", function(e) {
            tombol[e.key.toLowerCase()] = false;
        });

        // 17. Mengatur arah mouse
        canvas.addEventListener("mousemove", function(e) {
            let rect = canvas.getBoundingClientRect();

            mouse.x =
                (e.clientX - rect.left) *
                canvas.width / rect.width;

            mouse.y =
                (e.clientY - rect.top) *
                canvas.height / rect.height;
        });

        // 18. Menembak saat mouse diklik
        canvas.addEventListener("click", tembak);

        // 19. Jeda dan melanjutkan permainan
        function jedaGame() {
            if (!berjalan) return;

            dijeda = !dijeda;

            if (dijeda) {
                pesan.textContent = "Permainan dijeda.";
                cancelAnimationFrame(animasiID);
            } else {
                pesan.textContent = "Bertahan hidup!";
                animasi();
            }
        }