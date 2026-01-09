/**
 * Database Management Module for QuickChart
 * Uses sql.js for client-side SQLite database
 * 
 * Template Categories:
 * - public: Generic templates available to all users (e.g., DCHART-M, SOAP, SOAP-D)
 * - agency: Templates available to agency users (requires authentication)
 * - personal: User-specific templates (exclusive to the user)
 */

// Database state
let db = null;
let SQL = null;

// Database version for migrations
const DB_VERSION = 1;
const DB_STORAGE_KEY = 'QuickChart-DB';

/**
 * Initialize the sql.js library and database
 */
async function initDatabase() {
  if (db) return db;
  
  // Load sql.js
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
  }
  
  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem(DB_STORAGE_KEY);
  if (savedDb) {
    try {
      const binaryArray = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
      db = new SQL.Database(binaryArray);
      console.log('Loaded existing database from localStorage');
      
      // Check if migration is needed
      await migrateIfNeeded();
    } catch (e) {
      console.error('Failed to load saved database, creating new one:', e);
      db = new SQL.Database();
      await createSchema();
    }
  } else {
    // Create new database
    db = new SQL.Database();
    await createSchema();
    console.log('Created new database');
  }
  
  return db;
}

/**
 * Create the database schema
 */
async function createSchema() {
  // Create version table for migrations
  db.run(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY
    )
  `);
  
  // Insert current version
  db.run(`INSERT OR REPLACE INTO db_version (version) VALUES (?)`, [DB_VERSION]);
  
  // Templates table - stores template metadata
  db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT,
      category TEXT NOT NULL CHECK (category IN ('public', 'agency', 'personal')),
      agency_id TEXT,
      user_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Global dropdown options table
  db.run(`
    CREATE TABLE IF NOT EXISTS global_dropdown_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      option_key TEXT NOT NULL,
      option_values TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Template dropdown options table (local to a template)
  db.run(`
    CREATE TABLE IF NOT EXISTS template_dropdown_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      option_key TEXT NOT NULL,
      option_values TEXT NOT NULL,
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
    )
  `);
  
  // Common sentences table (shared across templates)
  db.run(`
    CREATE TABLE IF NOT EXISTS common_sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Narrative sections table
  db.run(`
    CREATE TABLE IF NOT EXISTS narrative_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      part TEXT NOT NULL,
      subpart TEXT,
      tooltip TEXT,
      include_title INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
    )
  `);
  
  // Section sentences table
  db.run(`
    CREATE TABLE IF NOT EXISTS section_sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (section_id) REFERENCES narrative_sections(id) ON DELETE CASCADE
    )
  `);
  
  // Create indexes for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_templates_agency ON templates(agency_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_template_dropdowns ON template_dropdown_options(template_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_narrative_sections_template ON narrative_sections(template_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_section_sentences ON section_sentences(section_id)`);
  
  saveDatabase();
}

/**
 * Check and perform migrations if needed
 */
async function migrateIfNeeded() {
  try {
    const result = db.exec('SELECT version FROM db_version LIMIT 1');
    const currentVersion = result.length > 0 && result[0].values.length > 0 
      ? result[0].values[0][0] 
      : 0;
    
    if (currentVersion < DB_VERSION) {
      console.log(`Migrating database from version ${currentVersion} to ${DB_VERSION}`);
      // Add migration logic here as needed
      db.run(`UPDATE db_version SET version = ?`, [DB_VERSION]);
      saveDatabase();
    }
  } catch (e) {
    console.log('Version table not found, creating schema');
    await createSchema();
  }
}

/**
 * Save the database to localStorage
 */
function saveDatabase() {
  if (!db) return;
  
  try {
    const data = db.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DB_STORAGE_KEY, base64);
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

/**
 * Import global configuration from JSON
 * @param {Object} globalData - The global.json data
 */
async function importGlobalConfig(globalData) {
  if (!db) await initDatabase();
  
  // Clear existing global dropdown options
  db.run('DELETE FROM global_dropdown_options');
  
  // Import global dropdown options
  if (globalData.globalDropdownOptions) {
    for (const [key, values] of Object.entries(globalData.globalDropdownOptions)) {
      db.run(
        'INSERT INTO global_dropdown_options (option_key, option_values) VALUES (?, ?)',
        [key, JSON.stringify(values)]
      );
    }
  }
  
  // Clear existing common sentences
  db.run('DELETE FROM common_sentences');
  
  // Import common sentences
  if (globalData.commonSentences) {
    for (const sentence of globalData.commonSentences) {
      const name = typeof sentence === 'object' ? sentence.name : null;
      const content = typeof sentence === 'object' ? JSON.stringify(sentence) : sentence;
      db.run(
        'INSERT INTO common_sentences (name, content) VALUES (?, ?)',
        [name, content]
      );
    }
  }
  
  saveDatabase();
  console.log('Imported global configuration');
}

/**
 * Import a template from JSON
 * @param {string} name - Template name (e.g., 'default', 'floyd')
 * @param {Object} templateData - The template JSON data
 * @param {string} category - Template category ('public', 'agency', 'personal')
 * @param {string} agencyId - Optional agency ID
 * @param {string} userId - Optional user ID
 */
async function importTemplate(name, templateData, category = 'public', agencyId = null, userId = null) {
  if (!db) await initDatabase();
  
  // Check if template already exists
  const existing = db.exec('SELECT id FROM templates WHERE name = ?', [name]);
  let templateId;
  
  if (existing.length > 0 && existing[0].values.length > 0) {
    templateId = existing[0].values[0][0];
    // Delete related data for re-import
    db.run('DELETE FROM template_dropdown_options WHERE template_id = ?', [templateId]);
    db.run('DELETE FROM section_sentences WHERE section_id IN (SELECT id FROM narrative_sections WHERE template_id = ?)', [templateId]);
    db.run('DELETE FROM narrative_sections WHERE template_id = ?', [templateId]);
    // Update template record
    db.run(
      'UPDATE templates SET display_name = ?, category = ?, agency_id = ?, user_id = ?, updated_at = datetime("now") WHERE id = ?',
      [name, category, agencyId, userId, templateId]
    );
  } else {
    // Insert new template
    db.run(
      'INSERT INTO templates (name, display_name, category, agency_id, user_id) VALUES (?, ?, ?, ?, ?)',
      [name, name, category, agencyId, userId]
    );
    const result = db.exec('SELECT last_insert_rowid()');
    templateId = result[0].values[0][0];
  }
  
  // Import local dropdown options
  const localOptions = templateData.localDropdownOptions || templateData.globalDropdownOptions || {};
  for (const [key, values] of Object.entries(localOptions)) {
    db.run(
      'INSERT INTO template_dropdown_options (template_id, option_key, option_values) VALUES (?, ?, ?)',
      [templateId, key, JSON.stringify(values)]
    );
  }
  
  // Import narrative sections
  if (templateData.narrativeSections) {
    for (let i = 0; i < templateData.narrativeSections.length; i++) {
      const section = templateData.narrativeSections[i];
      db.run(
        'INSERT INTO narrative_sections (template_id, part, subpart, tooltip, include_title, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [templateId, section.part, section.subpart || null, section.tooltip || null, section.includeTitle !== false ? 1 : 0, i]
      );
      
      const sectionResult = db.exec('SELECT last_insert_rowid()');
      const sectionId = sectionResult[0].values[0][0];
      
      // Import sentences for this section
      if (section.sentences) {
        for (let j = 0; j < section.sentences.length; j++) {
          const sentence = section.sentences[j];
          db.run(
            'INSERT INTO section_sentences (section_id, content, sort_order) VALUES (?, ?, ?)',
            [sectionId, JSON.stringify(sentence), j]
          );
        }
      }
    }
  }
  
  saveDatabase();
  console.log(`Imported template: ${name}`);
  return templateId;
}

/**
 * Get list of available templates
 * @param {string} category - Optional category filter
 * @param {string} agencyId - Optional agency ID filter
 * @param {string} userId - Optional user ID filter
 */
function getTemplates(category = null, agencyId = null, userId = null) {
  if (!db) return [];
  
  let query = 'SELECT id, name, display_name, category, agency_id, user_id FROM templates WHERE 1=1';
  const params = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (agencyId) {
    query += ' AND (agency_id = ? OR category = "public")';
    params.push(agencyId);
  }
  if (userId) {
    query += ' AND (user_id = ? OR category != "personal")';
    params.push(userId);
  }
  
  query += ' ORDER BY category, name';
  
  const result = db.exec(query, params);
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    id: row[0],
    name: row[1],
    displayName: row[2],
    category: row[3],
    agencyId: row[4],
    userId: row[5]
  }));
}

/**
 * Load a template configuration (formatted like the original JSON)
 * @param {string} templateName - Template name to load
 * @returns {Object} Template configuration in the original JSON format
 */
function loadTemplate(templateName) {
  if (!db) return null;
  
  // Get template
  const templateResult = db.exec('SELECT id FROM templates WHERE name = ?', [templateName]);
  if (templateResult.length === 0 || templateResult[0].values.length === 0) {
    return null;
  }
  const templateId = templateResult[0].values[0][0];
  
  // Get template-specific dropdown options
  const localOptions = {};
  const optionsResult = db.exec(
    'SELECT option_key, option_values FROM template_dropdown_options WHERE template_id = ?',
    [templateId]
  );
  if (optionsResult.length > 0) {
    for (const row of optionsResult[0].values) {
      localOptions[row[0]] = JSON.parse(row[1]);
    }
  }
  
  // Get narrative sections
  const sectionsResult = db.exec(
    'SELECT id, part, subpart, tooltip, include_title FROM narrative_sections WHERE template_id = ? ORDER BY sort_order',
    [templateId]
  );
  
  const narrativeSections = [];
  if (sectionsResult.length > 0) {
    for (const row of sectionsResult[0].values) {
      const section = {
        part: row[1],
        subpart: row[2],
        tooltip: row[3],
        includeTitle: row[4] === 1,
        sentences: []
      };
      
      // Get sentences for this section
      const sentencesResult = db.exec(
        'SELECT content FROM section_sentences WHERE section_id = ? ORDER BY sort_order',
        [row[0]]
      );
      if (sentencesResult.length > 0) {
        section.sentences = sentencesResult[0].values.map(r => JSON.parse(r[0]));
      }
      
      narrativeSections.push(section);
    }
  }
  
  return {
    localDropdownOptions: localOptions,
    narrativeSections: narrativeSections
  };
}

/**
 * Load global configuration
 * @returns {Object} Global configuration in the original JSON format
 */
function loadGlobalConfig() {
  if (!db) return { commonSentences: [], globalDropdownOptions: {} };
  
  // Get global dropdown options
  const globalDropdownOptions = {};
  const optionsResult = db.exec('SELECT option_key, option_values FROM global_dropdown_options');
  if (optionsResult.length > 0) {
    for (const row of optionsResult[0].values) {
      globalDropdownOptions[row[0]] = JSON.parse(row[1]);
    }
  }
  
  // Get common sentences
  const commonSentences = [];
  const sentencesResult = db.exec('SELECT content FROM common_sentences');
  if (sentencesResult.length > 0) {
    for (const row of sentencesResult[0].values) {
      try {
        commonSentences.push(JSON.parse(row[0]));
      } catch (e) {
        commonSentences.push(row[0]);
      }
    }
  }
  
  return {
    commonSentences: commonSentences,
    globalDropdownOptions: globalDropdownOptions
  };
}

/**
 * Check if the database has any templates
 */
function hasTemplates() {
  if (!db) return false;
  
  const result = db.exec('SELECT COUNT(*) FROM templates');
  return result.length > 0 && result[0].values[0][0] > 0;
}

/**
 * Check if global config exists in database
 */
function hasGlobalConfig() {
  if (!db) return false;
  
  const result = db.exec('SELECT COUNT(*) FROM global_dropdown_options');
  return result.length > 0 && result[0].values[0][0] > 0;
}

// Export functions for use in index.html
window.QuickChartDB = {
  initDatabase,
  saveDatabase,
  importGlobalConfig,
  importTemplate,
  getTemplates,
  loadTemplate,
  loadGlobalConfig,
  hasTemplates,
  hasGlobalConfig
};
