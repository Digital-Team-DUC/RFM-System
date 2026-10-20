# PostgreSQL Database Backup & Disaster Recovery Guide

## 1. Backup Strategy Overview

To ensure data integrity for critical financial and land ownership records, backups are executed across three tiers:

| Tier | Frequency | Retention | Storage Location |
| :--- | :--- | :--- | :--- |
| **Hourly Transaction Logs** | Every 60 minutes | 7 days | Encrypted Local & S3 Storage |
| **Daily Full Database Snapshot** | Daily at 02:00 AM | 30 days | S3 Immutable Cold Storage |
| **Monthly Consolidated Archive**| 1st of every month | 7 years | Offline / Compliance Storage |

---

## 2. Manual Backup Execution

### Creating a Full Database Dump via Docker

```bash
# Dump the complete PostgreSQL database to a timestamped compressed SQL archive
docker exec -t rfm_postgres pg_dump -U rfm_user -d rfm_db -F c -b -v -f /var/lib/postgresql/data/rfm_db_backup_$(date +%Y%m%d_%H%M%S).dump

# Copy the dump from the container to the host filesystem
docker cp rfm_postgres:/var/lib/postgresql/data/rfm_db_backup_$(date +%Y%m%d_%H%M%S).dump ./backups/
```

### Creating Plain SQL Text Dump (Human-Readable)

```bash
docker exec -t rfm_postgres pg_dump -U rfm_user -d rfm_db --clean --if-exists --inserts > backup_plain_$(date +%Y%m%d).sql
```

---

## 3. Database Restoration Procedure

> [!CAUTION]
> Performing a restore overwrites the current database. Always verify backups in a staging environment before executing in production.

### Step 1: Drop Existing Connections & Recreate Schema

```bash
# Terminate active backend connections to rfm_db
docker exec -it rfm_postgres psql -U rfm_user -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'rfm_db';"

# Drop and recreate database
docker exec -it rfm_postgres psql -U rfm_user -d postgres -c "DROP DATABASE IF EXISTS rfm_db;"
docker exec -it rfm_postgres psql -U rfm_user -d postgres -c "CREATE DATABASE rfm_db OWNER rfm_user;"
```

### Step 2: Restore from Compressed Dump

```bash
# Restore from archive file
docker exec -i rfm_postgres pg_restore -U rfm_user -d rfm_db -v /var/lib/postgresql/data/rfm_db_backup_20261021.dump
```

### Step 3: Verify Restoration Integrity

Run post-restoration audit queries:

```sql
-- 1. Verify organization & users count
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM users;

-- 2. Verify total properties and status counts
SELECT status, COUNT(*) FROM properties GROUP BY status;

-- 3. Verify Trial Balance is balanced: Debits == Credits
SELECT 
    SUM(debit) as total_debit, 
    SUM(credit) as total_credit,
    (SUM(debit) - SUM(credit)) as discrepancy
FROM journal_entry_lines;
```

---

## 4. Automated Daily Backup Script (Cron / Scheduled Task)

Create a scheduled script `scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/rfm"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/rfm_backup_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

# Run pg_dump and gzip in pipeline
docker exec -t rfm_postgres pg_dump -U rfm_user -d rfm_db | gzip > $FILENAME

# Remove backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed successfully: $FILENAME"
```
