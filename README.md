# 🎫 MeteTicket Bot v2.0

Ultra gelişmiş Discord Ticket & Moderasyon Botu — Node.js v24 uyumlu, saf JavaScript veritabanı (sql.js).

---

## 🚀 Kurulum

### 1. Gereksinimler
- Node.js v18 veya üzeri (v24 desteklenir)
- Discord Bot Token

### 2. Bağımlılıkları Yükle
```bash
npm install
```

### 3. .env Dosyasını Oluştur
```bash
copy .env.example .env
```
`.env` dosyasını düzenle ve `DISCORD_TOKEN` ile `CLIENT_ID` değerlerini gir.

### 4. Botu Başlat
```bash
npm start
```

---

## ⚙️ Yapılandırma

`src/config/config.js` dosyasından tüm bot ayarlarını özelleştirebilirsiniz:
- Ticket kategorileri ve renkleri
- Guard sistemi limitleri
- Anti-spam ayarları
- Embed renkleri ve stili

---

## 📋 Komutlar

### 🎫 Ticket Komutları
| Komut | Açıklama |
|-------|----------|
| `/ticket-panel` | Ticket paneli oluşturur |
| `/ticket-manage` | Ticket yönetimi (kapat/aç/sil/sahiplen) |
| `/ticket-remove` | Ticket'tan kullanıcı çıkarır |
| `/ticket-rename` | Ticket kanalını yeniden adlandırır |
| `/ticket-blacklist` | Kullanıcıyı ticket kara listesine ekler |
| `/ticket-whitelist` | Kullanıcıyı ticket kara listesinden çıkarır |
| `/ticket-transcript` | Ticket transkriptini oluşturur |

### 🔨 Moderasyon Komutları
| Komut | Açıklama |
|-------|----------|
| `/ban` | Kullanıcıyı banlar |
| `/unban` | Kullanıcının banını kaldırır |
| `/kick` | Kullanıcıyı sunucudan atar |
| `/mute` | Kullanıcıyı susturur |
| `/unmute` | Kullanıcının susturmasını kaldırır |
| `/warn` | Kullanıcıya uyarı verir |
| `/warnings` | Kullanıcının uyarılarını listeler |
| `/clear` | Mesajları toplu siler |
| `/lock` | Kanalı kilitler |
| `/unlock` | Kanalın kilidini açar |
| `/slowmode` | Kanal yavaş modunu ayarlar |

### ⚙️ Admin Komutları
| Komut | Açıklama |
|-------|----------|
| `/setup ticket` | Ticket sistemi ayarları |
| `/setup moderation` | Moderasyon log ayarları |
| `/setup guard` | Guard sistemi ayarları |
| `/setup logs` | Genel log kanalı ayarı |
| `/setup show` | Mevcut ayarları gösterir |

### 🔧 Utility Komutları
| Komut | Açıklama |
|-------|----------|
| `/ping` | Bot gecikme süresini gösterir |
| `/userinfo` | Kullanıcı bilgilerini gösterir |
| `/serverinfo` | Sunucu bilgilerini gösterir |
| `/stats server` | Sunucu istatistikleri |
| `/stats tickets` | Ticket istatistikleri |
| `/stats leaderboard` | Yetkili liderlik tablosu |

---

## 🛡️ Guard Sistemi

Otomatik sunucu koruma sistemi:
- **Anti-Ban**: Toplu ban koruması
- **Anti-Kick**: Toplu kick koruması
- **Anti-Role**: Toplu rol silme koruması
- **Anti-Channel**: Toplu kanal silme koruması
- **Anti-Webhook**: Webhook oluşturma koruması
- **Anti-Bot**: Bot ekleme koruması

---

## 📁 Proje Yapısı

```
meteticket/
├── src/
│   ├── commands/
│   │   ├── admin/        # Admin komutları
│   │   ├── moderation/   # Moderasyon komutları
│   │   ├── ticket/       # Ticket komutları
│   │   └── utility/      # Yardımcı komutlar
│   ├── config/           # Bot yapılandırması
│   ├── database/         # sql.js veritabanı
│   ├── events/           # Discord event'leri
│   ├── guards/           # Yetki kontrolleri
│   ├── handlers/         # Command/Event handler'ları
│   ├── layouts/          # Embed builder
│   ├── systems/          # Ticket/Guard/Log sistemleri
│   ├── utils/            # Yardımcı araçlar
│   └── index.js          # Ana giriş noktası
├── .env.example
├── package.json
└── README.md
```

---

## 🗄️ Veritabanı

Bu bot **sql.js** kullanır — Python veya derleme araçları gerektirmeyen saf JavaScript SQLite implementasyonu. Veriler `data/database.sqlite` dosyasına otomatik kaydedilir.

---

## 📝 Lisans

MIT License — MeteTicket © 2026