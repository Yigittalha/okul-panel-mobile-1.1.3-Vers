export const MENU_SCHEMA = {
  admin: [
    {
      key: "genel",
      title: "Genel",
      icon: "🏠",
      items: [
        { key: "dashboard", label: "Ana Sayfa", route: "AdminDashboard" },
      ],
    },
    {
      key: "yonetim",
      title: "Yönetim",
      icon: "⚙️",
      items: [
        { key: "ogretmenler", label: "Öğretmenler", route: "TeachersList" },
        { key: "ogrenciler", label: "Öğrenciler", route: "StudentsList" },
      ],
    },
    {
      key: "islemler",
      title: "İşlemler",
      icon: "📋",
      items: [],
    },
  ],

  teacher: [
    {
      key: "genel",
      title: "Genel",
      icon: "🏠",
      items: [
        { key: "dashboard", label: "Ana Sayfa", route: "TeacherDashboard" },
        { key: "profil", label: "Profil", route: "Profile" },
      ],
    },
    {
      key: "dersler",
      title: "Dersler",
      icon: "📚",
      items: [
        {
          key: "ders-programi",
          label: "Ders Programı",
          route: "TeacherScheduleScreen",
        },
        { key: "yoklama", label: "Yoklama Al", route: "TeacherSchedule" },
      ],
    },
    {
      key: "akademik",
      title: "Akademik İşlemler",
      icon: "📝",
      items: [
        { key: "sinavlarim", label: "Sınavlarım", route: "ExamsList" },
        { key: "odev-ver", label: "Verdiğim Ödevler", route: "HomeworksGivenList" },
      ],
    },
    {
      key: "ogrenci",
      title: "Öğrenci İşlemleri",
      icon: "👨‍🎓",
      items: [
        { key: "ogrenciler", label: "Tüm Öğrenciler", route: "StudentsList" },
      ],
    },
    {
      key: "iletisim",
      title: "İletişim",
      icon: "💬",
      items: [
        { key: "mesaj-gonder", label: "Mesaj Gönder", route: "MessageSend" },
        { key: "gelen-kutusu", label: "Gelen Kutusu", route: "MessageInbox" },
      ],
    },
  ],

  parent: [
    {
      key: "genel",
      title: "Genel",
      icon: "🏠",
      items: [
        { key: "dashboard", label: "Ana Sayfa", route: "StudentHomePage" },
        { key: "profil", label: "Profil", route: "ParentDashboard" },
      ],
    },
    {
      key: "dersler",
      title: "Dersler",
      icon: "📚",
      items: [
        {
          key: "ders-programi",
          label: "Ders Programı",
          route: "StudentScheduleScreen",
        },
      ],
    },
    {
      key: "akademik",
      title: "Akademik",
      icon: "📝",
      items: [
        { key: "odevlerim", label: "Ödevlerim", route: "StudentHomeworkList" },
        { key: "sinavlarim", label: "Sınavlarım", route: "StudentExamsList" },
        { key: "notlarim", label: "Notlarım", route: "StudentGrades" },
      ],
    },
    {
      key: "takip",
      title: "Takip",
      icon: "📊",
      items: [
        {
          key: "devamsizlik",
          label: "Devamsızlık Geçmişi",
          route: "StudentAbsences",
        },
      ],
    },
    {
      key: "iletisim",
      title: "İletişim",
      icon: "💬",
      items: [
        { key: "mesaj-gonder", label: "Mesaj Gönder", route: "StudentMessageSend" },
        { key: "gelen-kutusu", label: "Gelen Kutusu", route: "StudentMessageInbox" },
      ],
    },
  ],
};
