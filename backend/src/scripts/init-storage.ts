import { supabase } from "../supabaseClient";

async function initStorage() {
  const { data, error } = await supabase.storage.createBucket('uploads', {
    public: true,
  });

  if (error) {
    if (error.message.includes('already exists')) {
        console.log("Bucket 'uploads' already exists.");
    } else {
        console.error("Error creating bucket:", error);
    }
  } else {
    console.log("Bucket 'uploads' created successfully.");
  }
}

initStorage();
