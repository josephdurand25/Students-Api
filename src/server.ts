import app from './index';
import { testDbConnection } from './Config/db.config';
const PORT = process.env.PORT || 3002;

(async () => {
  await testDbConnection();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();