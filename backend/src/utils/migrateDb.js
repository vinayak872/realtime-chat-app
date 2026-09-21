import sequelize from '../config/database.js';

export const migrateDatabase = async () => {
  const summary = {
    dialect: sequelize.getDialect(),
    executed: [],
    skipped: [],
    errors: [],
  };

  try {
    const dialect = sequelize.getDialect();
    console.log(`[Migration] Running database migration for dialect: ${dialect}...`);

    if (dialect === 'postgres') {
      // In PostgreSQL, Sequelize defines 'Message' with table name "Messages" (quoted, case-sensitive).
      // Column names in mixed-case ("replyTo", "isDeleted", "isEdited") must also be double-quoted.
      // PostgreSQL requires native boolean literals (FALSE) rather than '0'.
      const postgresColumns = [
        { name: 'reactions', sql: `ALTER TABLE "Messages" ADD COLUMN IF NOT EXISTS "reactions" TEXT DEFAULT '[]';` },
        { name: 'replyTo', sql: `ALTER TABLE "Messages" ADD COLUMN IF NOT EXISTS "replyTo" TEXT DEFAULT NULL;` },
        { name: 'isDeleted', sql: `ALTER TABLE "Messages" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN DEFAULT FALSE;` },
        { name: 'isEdited', sql: `ALTER TABLE "Messages" ADD COLUMN IF NOT EXISTS "isEdited" BOOLEAN DEFAULT FALSE;` },
      ];

      for (const col of postgresColumns) {
        try {
          await sequelize.query(col.sql);
          console.log(`[Migration] ✓ Executed for "Messages": ${col.name}`);
          summary.executed.push({ table: 'Messages', column: col.name });
        } catch (err) {
          console.warn(`[Migration] Warning for "Messages" column ${col.name}:`, err.message);
          summary.errors.push({ table: 'Messages', column: col.name, error: err.message });
        }
      }

      // Also alter lowercase "messages" if it exists in the schema
      const lowercaseColumns = [
        { name: 'reactions', sql: `ALTER TABLE IF EXISTS "messages" ADD COLUMN IF NOT EXISTS "reactions" TEXT DEFAULT '[]';` },
        { name: 'replyTo', sql: `ALTER TABLE IF EXISTS "messages" ADD COLUMN IF NOT EXISTS "replyTo" TEXT DEFAULT NULL;` },
        { name: 'isDeleted', sql: `ALTER TABLE IF EXISTS "messages" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN DEFAULT FALSE;` },
        { name: 'isEdited', sql: `ALTER TABLE IF EXISTS "messages" ADD COLUMN IF NOT EXISTS "isEdited" BOOLEAN DEFAULT FALSE;` },
      ];

      for (const col of lowercaseColumns) {
        try {
          await sequelize.query(col.sql);
        } catch (err) {
          // ignore if table doesn't exist
        }
      }
    } else {
      // For SQLite / MySQL
      const queryInterface = sequelize.getQueryInterface();
      const candidateTables = ['Messages', 'messages'];

      for (const tableName of candidateTables) {
        try {
          const tableDesc = await queryInterface.describeTable(tableName);
          const existingCols = Object.keys(tableDesc).map((c) => c.toLowerCase());

          const columnsToAdd = [
            { name: 'reactions', type: 'TEXT', defaultValue: "'[]'" },
            { name: 'replyTo', type: 'TEXT', defaultValue: null },
            { name: 'isDeleted', type: 'BOOLEAN', defaultValue: '0' },
            { name: 'isEdited', type: 'BOOLEAN', defaultValue: '0' },
          ];

          for (const col of columnsToAdd) {
            if (!existingCols.includes(col.name.toLowerCase())) {
              try {
                const defaultClause =
                  col.defaultValue !== null ? ` DEFAULT ${col.defaultValue}` : '';
                await sequelize.query(
                  `ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}${defaultClause};`
                );
                console.log(`[Migration] ✓ Added column '${col.name}' to ${tableName}`);
                summary.executed.push({ table: tableName, column: col.name });
              } catch (err) {
                console.warn(`[Migration] Warning adding column ${col.name} to ${tableName}:`, err.message);
                summary.errors.push({ table: tableName, column: col.name, error: err.message });
              }
            } else {
              console.log(`[Migration] Column '${col.name}' already exists in ${tableName}`);
              summary.skipped.push({ table: tableName, column: col.name });
            }
          }
          break; // Found and migrated table
        } catch (err) {
          // Table doesn't exist, try next candidate
        }
      }
    }

    console.log('[Migration] Database migration check complete.');
    return { success: true, summary };
  } catch (err) {
    console.error('[Migration] Migration fatal error:', err);
    return { success: false, error: err.message, summary };
  }
};

if (process.argv[1] && process.argv[1].endsWith('migrateDb.js')) {
  migrateDatabase().then((res) => {
    console.log('Result:', JSON.stringify(res, null, 2));
    process.exit(res.success ? 0 : 1);
  });
}
