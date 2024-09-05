# summary

Migrates data from one org to another

# description

Migrates selected data based on a configuration file from a source org and into a target org

# examples

- Migrate data using a specific configuration file and org aliases
  
  $ <%= config.bin %> <%= command.id %> -s sourceOrg -t targetOrg -f "/config/data-seed.json"

- Migrate data using default configuration file and usernames for each org
  
  $ <%= config.bin %> <%= command.id %> --source-org="source@org.com" --target-org="target@org.com" --config-file="/config/data-seed.json"


# flags.target-org.summary

Username or alias of the Target org where data will be migrated to.

# flags.source-org.summary

Username or alias of the Source org where data will be migrated from.

# flags.config-file.summary

Path to data migration JSON configuration file.

# flags.async.summary

Run the command asynchronously.

# flags.wait.summary

Number of minutes to wait for command to complete.

# report.suggestion

 - Check the status with: sf data-seeding migrate report -i %s
