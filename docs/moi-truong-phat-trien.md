# 4.1 Moi truong phat trien

Du an duoc xay dung theo mo hinh tach biet Frontend va Backend. Frontend su dung ReactJS ket hop Vite de xay dung giao dien nguoi dung. Backend su dung Node.js va Express.js de xay dung REST API. Co so du lieu su dung MongoDB, ket noi thong qua thu vien Mongoose.

## Bang cong nghe va phien ban su dung

| Thanh phan | Cong nghe / thu vien | Phien ban |
|---|---|---:|
| Runtime | Node.js | 20.17.0 |
| Package manager | npm | 10.8.2 |
| Frontend framework | React | 19.2.0 |
| Frontend render | React DOM | 19.2.0 |
| Build tool | Vite | 7.1.9 |
| CSS framework | Tailwind CSS | 4.1.14 |
| Router | React Router DOM | 7.9.4 |
| HTTP client | Axios | Frontend: 1.12.2, Backend: 1.13.2 |
| State management | Zustand | 5.0.8 |
| Icon library | Lucide React | 0.547.0 |
| Backend framework | Express.js | 5.1.0 |
| Database | MongoDB Atlas / MongoDB | Database: CDTN |
| Database ODM | Mongoose | 6.10.0 |
| MongoDB driver | mongodb | 5.7.0 |
| Authentication | jsonwebtoken | 9.0.2 |
| Password hashing | bcryptjs | 3.0.2 |
| Environment config | dotenv | 17.4.1 |
| File upload | multer | 2.0.2 |
| Realtime | Socket.IO | Backend: 4.8.3 |
| Realtime client | Socket.IO Client | Frontend: 4.8.1 |
| Mail service | nodemailer | 7.0.9 |
| Payment | vnpay | 2.4.4 |
| Development tool | nodemon | 3.1.10 |

## Hinh anh minh hoa can chup

### Frontend

Chup man hinh thu muc `frontend`, file `package.json`, terminal chay frontend bang lenh `npm run dev`, hoac giao dien website dang chay tren trinh duyet.

### Backend

Chup man hinh thu muc `backend`, file cau hinh server/API, terminal chay backend o cong `5000`, hoac ket qua backend ket noi database thanh cong.

### Luoc do co so du lieu

Chup man hinh MongoDB Atlas hoac MongoDB Compass hien thi database `CDTN` va cac collection cua he thong, vi du: `users`, `products`, `productcategories`, `orders`, `carts`, `vouchers`, `blogs`, `blogcategories`, `reservations`, `contacts`, `ingredients`, `recipes`, `importreceipts`.
Luu y: khong dua noi dung file `.env`, mat khau, API key hoac connection string vao bao cao.
