# מדריך העלאה ל-GitHub וחיבור ל-Render.com 🚀
## Guide for Deploying Simply Music to GitHub & Render.com

שלום! הכנו עבורך את כל הקבצים הדרושים (`render.yaml`, `Dockerfile`, הגדרות שרת וקונפיגורציה מלאה) כדי שתוכל להעלות את הפרויקט ל-GitHub ולחבר אותו ישירות ל-Render.com בכמה קליקים פשוטים.

---

### שלב 1: העלאת הקוד ל-GitHub (שתי אפשרויות קלות)

#### אפשרות א': ייצוא ישיר מתוך Google AI Studio (הכי פשוט!)
1. בראש המסך של **Google AI Studio**, לחץ על תפריט שלוש הנקודות `⋮` (או הגדרות / שתף).
2. בחר **Export to GitHub** (או **Download ZIP** אם תרצה להעלות ידנית).
3. בחר את חשבון ה-GitHub שלך ותן שם למאגר (למשל `simply-music`).
4. הפרויקט יעלה מיד למאגר ה-GitHub שלך!

#### אפשרות ב': העלאה באמצעות Git (אם הורדת כ-ZIP או במחשב)
בטרמינל או ב-Command Prompt בתיקיית הפרויקט:
```bash
# 1. יצירת מאגר ב-GitHub.com (בשם simply-music למשל)
# 2. הרצת הפקודות הבאות:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/simply-music.git
git push -u origin main
```

---

### שלב 2: חיבור והרצה ב-Render.com בחינם

1. היכנס לחשבון שלך ב-**[Render.com](https://render.com/)**.
2. לחץ על **New +** ובחר **Web Service** (או **Blueprint**).
3. חבר את חשבון ה-GitHub שלך ובחר במאגר שיצרת (`simply-music`).
4. **הגדרות שירות (Render יזהה אוטומטית הודות לקובץ `render.yaml` שיצרנו):**
   - **Name:** `simply-music`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (may sleep after inactivity; use a paid instance for guaranteed always-on uptime)
5. בלשונית **Environment Variables**, הוסף (או אשר):
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `JWT_SECRET`: מחרוזת אקראית כלשהי לאבטחת התחברות
6. לחץ על **Create Web Service**!

המאגר כולל GitHub Actions workflow בשם `Keep Render Alive` שמבצע בדיקת `/api/health` חיצונית כל 10 דקות. יש לוודא ש־GitHub Actions מופעל ושכתובת Render בקובץ `.github/workflows/keep-alive.yml` תואמת לכתובת השירות שלך. Render עדיין רשאי לישון, ולכן זמינות רציפה מובטחת רק בתוכנית שאינה Free.

תוך 2-3 דקות האתר שלך יהיה באוויר עם כתובת רשמית של Render (למשל: `https://simply-music.onrender.com`), עם תמיכה מלאה בהשמעת שירים, מילים מסונכרנות אותנטיות, התחברות משתמשים ונגן מתקדם!
