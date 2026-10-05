import { PageDocContent } from "../components/PageDocBanner";

export const pageDocs: Record<string, PageDocContent> = {
  dashboard: {
    title: "Ringkasan Kantor",
    tagline: "Pusat Kontrol Operasional & Statistik Tim AI",
    summary:
      "Halaman Dashboard adalah cockpit utama bagi CEO untuk memantau performa kantor virtual JURLAY AGENT. Di sini Anda bisa melihat metrik tugas yang sedang berjalan, status kehadiran agen AI, shortcut pendelegasian mandat baru, serta log aktivitas tim terkini.",
    keyFeatures: [
      {
        title: "Kartu Metrik & Statistik",
        desc: "Melihat total tugas terdaftar, rapat aktif, tugas selesai, dan jumlah karyawan AI dalam satu pandangan.",
      },
      {
        title: "Status Live Karyawan AI",
        desc: "Memantau ketersediaan Domba (PM), Sapi (Backend), Hayam (Frontend), Kuya (QA), dan Tirex (DevOps).",
      },
      {
        title: "Tombol Delegasi Mandat Cepat",
        desc: "Memberikan instruksi task baru langsung ke Lead PM Domba dengan prioritas dan target terukur.",
      },
      {
        title: "Tabel Aktivitas Berjalan",
        desc: "Daftar ringkas tugas yang sedang dieksekusi beserta persentase progres dan status terkini.",
      },
    ],
    workflowSteps: [
      {
        step: "1",
        title: "Cek Status Kantor",
        desc: "Periksa apakah ada rapat yang sedang berlangsung atau tugas yang menunggu persetujuan.",
      },
      {
        step: "2",
        title: "Beri Mandat Baru",
        desc: "Klik tombol 'Beri Mandat Baru' untuk mendelegasikan kebutuhan software ke Domba (PM).",
      },
      {
        step: "3",
        title: "Navigasi Cepat",
        desc: "Beralih ke Papan Tugas atau Ruang Diskusi dengan sekali klik dari panel aksi cepat.",
      },
    ],
    tips: [
      "Gunakan dashboard di awal hari kerja untuk melihat pipeline task dan memonitor kesehatan server.",
      "Klik kartu tugas langsung untuk melompat ke detail progres atau ruang rapat terkait.",
    ],
  },

  tasks: {
    title: "Papan Tugas (Kanban)",
    tagline: "Pipeline Alur Kerja Tugas dari Ide sampai Selesai",
    summary:
      "Papan Tugas menerapkan alur Kanban interaktif 5 tahap: Backlog (Antrean) → Diskusi Meeting → Sedang Dikerjakan → Review QA → Selesai. Semua mandat yang diberikan CEO otomatis tercatat di sini dan dikoordinasikan oleh Domba (Lead PM).",
    keyFeatures: [
      {
        title: "5 Kolom Alur Kanban",
        desc: "Visualisasi perpindahan status tugas secara transparan dari konsep awal hingga siap rilis.",
      },
      {
        title: "Badge Prioritas & Kode Unik",
        desc: "Setiap task memiliki kode identitas (misal TASK-001) dan tingkat urgensi (Tinggi, Sedang, Rendah).",
      },
      {
        title: "Aksi Mulai Diskusi (Meeting)",
        desc: "Tombol cepat untuk membawa task dari Backlog ke Ruang Meeting untuk dibahas bersama tim AI.",
      },
      {
        title: "Tombol Monitor Progres",
        desc: "Melihat langkah demi langkah eksekusi sub-task yang sedang dikerjakan secara langsung.",
      },
    ],
    workflowSteps: [
      {
        step: "1",
        title: "Buat Mandat Tugas",
        desc: "Buat tiket tugas dengan judul, deskripsi jelas, dan prioritas. Tugas otomatis masuk ke kolom Backlog.",
      },
      {
        step: "2",
        title: "Bawa ke Ruang Diskusi",
        desc: "Klik 'Mulai Rapat' pada kartu tugas untuk mendiskusikan arsitektur dan pembagian sub-task.",
      },
      {
        step: "3",
        title: "Setujui Rencana Eksekusi",
        desc: "Setelah tim menyepakati action plan, klik 'Setujui Rencana' agar tugas pindah ke 'Sedang Dikerjakan'.",
      },
    ],
    tips: [
      "Pastikan setiap tugas didiskusikan terlebih dahulu di Ruang Meeting agar sub-task teknis tersusun rapi.",
    ],
  },

  meetings: {
    title: "Ruang Diskusi (Meeting Room)",
    tagline: "Forum Brainstorming Arsitektur & Breakdown Sub-Task",
    summary:
      "Ruang Diskusi adalah tempat para agen AI (Domba PM, Sapi Backend, Hayam Frontend, Kuya QA) berkumpul secara otomatis ketika ada tugas baru. Mereka menganalisis brief CEO, mendiskusikan arsitektur teknis, dan memecah pekerjaan menjadi sub-task terperinci.",
    keyFeatures: [
      {
        title: "Diskusi Multi-Agen Cerdas",
        desc: "Setiap agen memberikan masukan sesuai keahliannya: Sapi soal database, Hayam soal UI/UX, Kuya soal risiko bug.",
      },
      {
        title: "Breakdown Sub-Task Otomatis",
        desc: "Domba (PM) merumuskan rencana aksi konkret dan membagi sub-task untuk masing-masing developer.",
      },
      {
        title: "Persetujuan Rencana oleh CEO",
        desc: "Eksekusi kode tidak akan dimulai sebelum CEO meninjau dan menekan tombol 'Setujui Rencana Rapat'.",
      },
      {
        title: "Interaksi CEO dalam Rapat",
        desc: "CEO dapat mengetik instruksi tambahan di kolom chat rapat untuk memberikan arahan langsung ke tim.",
      },
    ],
    workflowSteps: [
      {
        step: "1",
        title: "Pilih Tugas yang Ingin Dibahas",
        desc: "Pilih salah satu tugas dari daftar dropdown di bagian atas ruang meeting.",
      },
      {
        step: "2",
        title: "Simak Diskusi Tim AI",
        desc: "Lihat Domba memimpin rapat, Sapi dan Hayam merancang sistem, dan Kuya memvalidasi skenario.",
      },
      {
        step: "3",
        title: "Kirim Instruksi atau Setujui",
        desc: "Tulis masukan Anda jika ada yang perlu direvisi, lalu klik 'Setujui Rencana' untuk memulai pengerjaan.",
      },
    ],
    tips: [
      "Prinsip utama JURLAY AGENT: 'Matangkan dulu, jangan langsung di-gas!' Rapat memastikan tidak ada salah paham teknis.",
    ],
  },

  progress: {
    title: "Progres Eksekusi Langsung",
    tagline: "Live Streaming Pengerjaan Sub-Task & Log Terminal Karyawan AI",
    summary:
      "Halaman Progres Langsung adalah radar pemantau eksekusi otonom. Setelah rencana disetujui di Ruang Meeting, agen AI mulai mengeksekusi sub-task mereka satu per satu. Di sini Anda bisa melihat langkah konkret apa yang sedang dikerjakan secara real-time detik demi detik.",
    keyFeatures: [
      {
        title: "Daftar Sub-Task & Progress Bar",
        desc: "Panel kiri memperlihatkan daftar tahapan kerja (Frontend, Backend, QA) lengkap dengan persentase kemajuan.",
      },
      {
        title: "Streaming Log Terminal & Tool Eksekusi",
        desc: "Panel kanan menampilkan live log aksi: pembacaan file, penulisan script, eksekusi shell, dan patch kode.",
      },
      {
        title: "Indikator Agen yang Sedang Bekerja",
        desc: "Melihat avatar dan nama karyawan AI yang bertanggung jawab atas sub-task yang sedang aktif.",
      },
      {
        title: "Status Sub-Task (Antrean, Berjalan, Tuntas)",
        desc: "Setiap langkah ditandai secara visual sehingga CEO tahu persis di mana posisi proyek sekarang.",
      },
    ],
    workflowSteps: [
      {
        step: "1",
        title: "Pilih Tugas Aktif",
        desc: "Pilih tugas yang sedang dalam tahap pengerjaan (In Progress) dari daftar tugas di atas.",
      },
      {
        step: "2",
        title: "Pantau Jalannya Sub-Task",
        desc: "Lihat sub-task mana yang sedang dikerjakan oleh Sapi, Hayam, Kuya, atau Tirex.",
      },
      {
        step: "3",
        title: "Tinjau Hasil Log Eksekusi",
        desc: "Periksa output di terminal log untuk memastikan setiap script dan berkas dibuat tanpa kendala.",
      },
    ],
    tips: [
      "Jika sub-task selesai 100%, sistem otomatis memindahkan tugas ke tahap QA Review atau Selesai di Papan Tugas.",
      "Anda tidak perlu menjalankan perintah manual; agen AI menjalankan tool mereka sesuai hak akses masing-masing.",
    ],
  },

  terminals: {
    title: "Multi-Terminal Web",
    tagline: "Akses Shell OS Interaktif Terintegrasi & Multi-Tab",
    summary:
      "Multi-Terminal menyediakan akses langsung ke shell sistem operasi lokal (Bash di macOS/Linux atau CMD di Windows). Anda bisa membuka banyak sesi tab terminal sekaligus untuk menjalankan perintah git, instalasi dependency, build runner, atau diagnosa server.",
    keyFeatures: [
      {
        title: "Multi-Tab Terisolasi",
        desc: "Buka beberapa sesi terminal sekaligus (Tab 1, Tab 2, dst.) tanpa saling mengganggu proses satu sama lain.",
      },
      {
        title: "Pintasan Perintah Cepat",
        desc: "Tersedia tombol satu-klik untuk perintah umum seperti 'ls -la', 'git status', dan 'clear'.",
      },
      {
        title: "Reset Shell Kapan Saja",
        desc: "Jika ada proses yang menggantung atau error, cukup klik 'Reset Shell' untuk membuka sesi baru yang segar.",
      },
      {
        title: "Engine xterm.js Modern",
        desc: "Mendukung warna ANSI lengkap, scrolling lancar, auto-wrap baris, dan penanganan resize otomatis.",
      },
    ],
    workflowSteps: [
      {
        step: "1",
        title: "Pilih Sesi Terminal",
        desc: "Klik salah satu tab di bagian atas untuk berpindah sesi aktif atau klik '+' untuk sesi baru.",
      },
      {
        step: "2",
        title: "Ketik Perintah di Shell",
        desc: "Klik area terminal hitam dan ketik perintah seperti di aplikasi terminal komputer biasa.",
      },
      {
        step: "3",
        title: "Gunakan Tombol Pintasan",
        desc: "Manfaatkan tombol shortcut di atas terminal untuk eksekusi perintah rutin dengan cepat.",
      },
    ],
    tips: [
      "Terminal ini berjalan langsung di direktori kerja proyek (/Applications/hamzah_belajar/jurlay_agent).",
    ],
  },

  github: {
    title: "Repositori GitHub Hub",
    tagline: "Pusat Sinkronisasi Codebase & Registrasi Proyek",
    summary:
      "GitHub Project Hub menghubungkan kantor virtual JURLAY AGENT dengan repositori kode sumber Anda. Di sini Anda bisa mendaftarkan repo GitHub, memantau branch default, melihat status sinkronisasi, dan menyiapkan codebase untuk diolah oleh tim AI.",
    keyFeatures: [
      {
        title: "Daftar Repositori Proyek",
        desc: "Kartu proyek yang menampilkan nama repo, URL GitHub, branch aktif, dan waktu sync terakhir.",
      },
      {
        title: "Tambah Repositori Baru",
        desc: "Formulir mudah untuk menghubungkan proyek GitHub baru ke dalam ekosistem kerja tim AI.",
      },
      {
        title: "Pintasan Git Status & Sync",
        desc: "Melihat status branch dan file yang berubah langsung dari antarmuka proyek.",
      },
    ],
    workflowSteps: [
      {
        step: "1",
        title: "Tambah Repositori",
        desc: "Klik 'Tambah Repositori' dan masukkan URL GitHub serta branch utama yang ingin dikerjakan.",
      },
      {
        step: "2",
        title: "Tautkan ke Mandat Tugas",
        desc: "Saat membuat tugas baru di Kanban, Anda bisa mengarahkan tugas ke repositori yang sudah terdaftar.",
      },
      {
        step: "3",
        title: "Sinkronisasi Kode",
        desc: "Pastikan kode lokal dan remote selalu selaras sebelum agen AI melakukan patch perubahan.",
      },
    ],
    tips: [
      "Gunakan branch khusus fitur (feature branch) agar pekerjaan karyawan AI tetap terisolasi dan mudah di-review.",
    ],
  },

  employees: {
    title: "Karyawan & Tim AI",
    tagline: "Struktur Organisasi, Hak Akses Tool & Chat Personal 1-on-1",
    summary:
      "Halaman ini menampilkan seluruh personil AI di JURLAY AGENT: Domba (PM), Sapi (Backend), Hayam (Frontend), Kuya (QA), dan Tirex (DevOps). Anda dapat melihat hak akses tools mereka, merekrut karyawan baru secara dinamis, serta mengobrol langsung secara personal 1-on-1 melalui model combogravuty.",
    keyFeatures: [
      {
        title: "Roster Karyawan Resmi",
        desc: "Melihat spesialisasi tiap karyawan, avatar karakter, username profil, dan persona kerjanya.",
      },
      {
        title: "Chat Personal 1-on-1 (9router combogravuty)",
        desc: "Mengobrol langsung dengan karyawan pilihan Anda. AI berpikir cerdas menjawab pertanyaan teknis Anda.",
      },
      {
        title: "Pengaturan Privilege Tools",
        desc: "Transparansi tools apa saja yang diizinkan untuk tiap agen (read_file, write_file, terminal, patch, web_search).",
      },
      {
        title: "Rekrut Karyawan Baru (Hire AI)",
        desc: "Tambahkan personil AI baru dengan mendefinisikan nama, peran, dan system prompt khusus.",
      },
    ],
    workflowSteps: [
      {
        step: "1",
        title: "Pilih Karyawan",
        desc: "Cari karyawan yang ingin diajak bicara atau didelegasikan tugas di kartu daftar karyawan.",
      },
      {
        step: "2",
        title: "Klik 'Chat Personal'",
        desc: "Jendela obrolan floating akan muncul di pojok kanan bawah tanpa menutup layar kerja Anda.",
      },
      {
        step: "3",
        title: "Beri Instruksi atau Tanya Teknis",
        desc: "Ketik arahan Anda atau gunakan tombol pertanyaan cepat (quick prompts) untuk respons instan.",
      },
    ],
    tips: [
      "Obrolan personal tersimpan di database MySQL, sehingga Anda tidak akan kehilangan riwayat diskusi sebelumnya.",
      "Jendela chat di pojok kanan bawah bisa dikecilkan (minimize) agar tidak menghalangi pekerjaan lain.",
    ],
  },
};
