import os
import shutil
import datetime

# Database Backup Script for SQLite

def backup_sqlite():
    print("Starting automated database backup...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'db.sqlite3')
    backup_dir = os.path.join(base_dir, 'backups')
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        
    if not os.path.exists(db_path):
        print("db.sqlite3 not found. Skipping backup.")
        return
        
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(backup_dir, f'db_backup_{timestamp}.sqlite3')
    
    shutil.copy2(db_path, backup_file)
    print(f"Backup successfully created at: {backup_file}")

if __name__ == '__main__':
    # In production, this would use pg_dump for PostgreSQL.
    # For now, it gracefully handles SQLite backups.
    backup_sqlite()
