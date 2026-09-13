import sequelize from '../config/database.js';

export const migrateDatabase = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableDesc = await queryInterface.describeTable('Messages');

    const columnsToAdd = [
      { name: 'reactions', type: 'TEXT', defaultValue: "'[]'" },
      { name: 'replyTo', type: 'TEXT', defaultValue: null },
      { name: 'isDeleted', type: 'BOOLEAN', defaultValue: '0' },
      { name: 'isEdited', type: 'BOOLEAN', defaultValue: '0' },
    ];

    for (const col of columnsToAdd) {
      if (!tableDesc[col.name]) {
        console.log(`Adding missing column '${col.name}' to Messages table...`);
        try {
          const defaultClause = col.defaultValue !== null ? ` DEFAULT ${col.defaultValue}` : '';
          await sequelize.query(`ALTER TABLE Messages ADD COLUMN ${col.name} ${col.type}${defaultClause};`);
          console.log(`✓ Added column '${col.name}'`);
        } catch (err) {
          console.warn(`Warning adding column ${col.name}:`, err.message);
        }
      } else {
        console.log(`Column '${col.name}' already exists.`);
      }
    }

    console.log('Database migration check complete.');
  } catch (err) {
    console.error('Migration error:', err);
  }
};

if (process.argv[1] && process.argv[1].endsWith('migrateDb.js')) {
  migrateDatabase().then(() => process.exit(0));
}
