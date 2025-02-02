import { app } from "./app";
import { initServices } from "./services/initServices";

const PORT = process.env.PORT || 4242;

// Conditionally initialize services only if not testing
if (process.env.NODE_ENV !== 'test') {
  initServices();
}

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});