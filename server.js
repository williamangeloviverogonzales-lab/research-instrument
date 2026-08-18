const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname))); 

// Supabase Configuration
const SUPABASE_URL = "https://fkeujqzgqupvjcqreqcs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_P2-r3rUN2REqf-jHtA-Img_CvegMFFf";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Shortcut Route for Main Survey Page (Fixes "Cannot GET /")
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Shortcut Route for Dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API Endpoint: Submit Survey Response
app.post('/api/responses', async (req, res) => {
  try {
    const newEntry = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      data: req.body // Bundle all form responses into the jsonb data column
    };
    
    const { error } = await supabase
      .from('responses')
      .insert([newEntry]);

    if (error) throw error;
    
    res.status(201).json({ success: true, id: newEntry.id });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Fetch Dashboard Data
app.get('/api/responses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    // Flatten the JSONB data back out so dashboard.js can read fields like .school_name, .age, etc.
    const formattedData = data.map(row => {
      let parsedData = {};
      if (row.data) {
        parsedData = typeof row.data === 'object' ? row.data : JSON.parse(row.data);
      }
      return {
        id: row.id,
        created_at: row.created_at,
        ...parsedData
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Delete Survey Response by ID
app.delete('/api/responses/:id', async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { error } = await supabase
      .from('responses')
      .delete()
      .eq('id', targetId);

    if (error) throw error;
    
    res.json({ success: true, message: 'Response deleted successfully' });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Local server running smoothly at http://localhost:${PORT}`);
});