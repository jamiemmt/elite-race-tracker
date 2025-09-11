/*
xx
      
      const deleteCount = await Athlete.deleteMany({
        $or: [
          { name: { $regex: /^\d{2}\/\d{2}\/\d{4}$/ } },
          { name: { $regex: /^\d+$/ } },
          { name: { $regex: /^[A-Z]{1,3}$/ } },
          { name: { $regex: /\d{2}\/\d{2}\/\d{4}/ } },
          { name: { $regex: /^#/ } },
          { name: { $in: ['BAKHAREVA S LAS T NI KOVA', 'GONZALES ROMERO', 'WATHTHAKANKANAMGE', '#power Of Respect'] } },
          { country: { $in: ['MARYNA BEKH-ROMANCHUK', 'RONCER KIPKORIR KONGA', 'BLESSING OKAGBARE', 'MOHAMED KATIR', 'CELESTINE CHEPCHIRCHIR'] } },
          { banSource: 'AIU Web', name: { $regex: /^[A-Z\s]{50,}$/ } },
          { banSource: 'AIU Web', name: { $not: { $regex: /^[A-Z][a-zA-Z\s\-'\.]+$/ } } }
        ]
      });
      
      console.log(`Cleaned up ${deleteCount.deletedCount} invalid AIU entries`);
      return { deletedCount: deleteCount.deletedCount, invalidEntries: invalidEntries.length };
      
    } catch (error) {
      console.error('Error cleaning up invalid AIU entries:', error);
      throw error;

    console.log('Fetching all current AIU banned athletes from live sources...');

    // Get live data from all AIU sources
    const [provisionalAthletes, firstInstanceAthletes, aiuPdfAthletes] = await Promise.allSettled([
      this.parseProvisionalSuspensions(),
      this.parseFirstInstanceDecisions(), 
      this.downloadAndParseAiuList()
    ]);

    // Combine all results
    const allAiuAthletes = [];

    if (provisionalAthletes.status === 'fulfilled') {
      allAiuAthletes.push(...provisionalAthletes.value);
      console.log(`✓ Found ${provisionalAthletes.value.length} provisional suspensions`);
    } else {
      console.error('✗ Failed to fetch provisional suspensions:', provisionalAthletes.reason?.message);
      errors.push('Provisional suspensions failed');
    }

    if (firstInstanceAthletes.status === 'fulfilled') {
      allAiuAthletes.push(...firstInstanceAthletes.value);
      console.log(`✓ Found ${firstInstanceAthletes.value.length} first instance decisions`);
    } else {
      console.error('✗ Failed to fetch first instance decisions:', firstInstanceAthletes.reason?.message);
      errors.push('First instance decisions failed');
    }

    if (aiuPdfAthletes.status === 'fulfilled') {
      allAiuAthletes.push(...aiuPdfAthletes.value);
      console.log(`✓ Found ${aiuPdfAthletes.value.length} athletes from AIU PDF`);
    } else {
      console.error('✗ Failed to fetch AIU PDF:', aiuPdfAthletes.reason?.message);
      errors.push('AIU PDF failed');
    }

    console.log(`Total found: ${allAiuAthletes.length} athletes from AIU sources`);

    // Process each athlete
    for (const bannedAthlete of allAiuAthletes) {
      try {
        // Skip athletes without proper name or country
        if (!bannedAthlete.name || !bannedAthlete.country || bannedAthlete.name.length < 2) {
          console.log(`Skipping invalid athlete: ${bannedAthlete.name || 'No name'} (${bannedAthlete.country || 'No country'})`);
          continue;
        }

        // Check if athlete already exists (case-insensitive name match)
        const existingAthlete = await Athlete.findOne({
          name: new RegExp(`^${bannedAthlete.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          country: bannedAthlete.country
        });

        if (existingAthlete) {
          // Update existing athlete with ban information
          let updated = false;

          if (!existingAthlete.isBanned && bannedAthlete.isBanned) {
            existingAthlete.isBanned = bannedAthlete.isBanned;
            updated = true;
          }

          if (!existingAthlete.isProvisionallyBanned && bannedAthlete.isProvisionallyBanned) {
            existingAthlete.isProvisionallyBanned = bannedAthlete.isProvisionallyBanned;
            updated = true;
          }

          if (!existingAthlete.banReason && (bannedAthlete.banReason || bannedAthlete.reason)) {
            existingAthlete.banReason = bannedAthlete.banReason || bannedAthlete.reason;
            updated = true;
          }

          if (!existingAthlete.banSource && (bannedAthlete.banSource || bannedAthlete.source)) {
            existingAthlete.banSource = bannedAthlete.banSource || bannedAthlete.source;
            updated = true;
          }

          if (!existingAthlete.banAgency && (bannedAthlete.banAgency || bannedAthlete.agency)) {
            existingAthlete.banAgency = bannedAthlete.banAgency || bannedAthlete.agency;
            updated = true;
          }

          if (!existingAthlete.banType && bannedAthlete.banType) {
            existingAthlete.banType = bannedAthlete.banType;
            updated = true;
          }

          if (!existingAthlete.banDateDetected && (bannedAthlete.banDateDetected || bannedAthlete.dateDetected)) {
            existingAthlete.banDateDetected = bannedAthlete.banDateDetected || bannedAthlete.dateDetected;
            updated = true;
          }

          if (!existingAthlete.banStatus && bannedAthlete.banStatus) {
            existingAthlete.banStatus = bannedAthlete.banStatus;
            updated = true;
          }

          if (updated) {
            await existingAthlete.save();
            totalUpdated++;
            console.log(`Updated ${existingAthlete.name} (${existingAthlete.country}) - ${bannedAthlete.banStatus || 'banned'}`);
          }
        } else {
          // Create new athlete
          const updateData = {
            isBanned: bannedAthlete.isBanned || false,
            isProvisionallyBanned: bannedAthlete.isProvisionallyBanned || false,
            banReason: bannedAthlete.banReason || bannedAthlete.reason,
            banSource: bannedAthlete.banSource || bannedAthlete.source,
            banAgency: bannedAthlete.banAgency || bannedAthlete.agency,
            banType: bannedAthlete.banType,
            banDateDetected: bannedAthlete.banDateDetected || bannedAthlete.dateDetected,
            banStatus: bannedAthlete.banStatus || 'cleared'
          };

          const newAthlete = new Athlete({
            name: bannedAthlete.name,
            country: bannedAthlete.country,
            gender: 'Female', // Default to Female, will be updated when we have more data
            ...updateData
          });
            if (!existingAthlete.banReason && (bannedAthlete.banReason || bannedAthlete.reason)) {
              existingAthlete.banReason = bannedAthlete.banReason || bannedAthlete.reason;
              updated = true;
            }
            
            if (!existingAthlete.banSource && (bannedAthlete.banSource || bannedAthlete.source)) {
              existingAthlete.banSource = bannedAthlete.banSource || bannedAthlete.source;
              updated = true;
            }
            
            if (!existingAthlete.banAgency && (bannedAthlete.banAgency || bannedAthlete.agency)) {
              existingAthlete.banAgency = bannedAthlete.banAgency || bannedAthlete.agency;
              updated = true;
            }
            
            if (!existingAthlete.banType && bannedAthlete.banType) {
              existingAthlete.banType = bannedAthlete.banType;
              updated = true;
            }
            
            if (!existingAthlete.banDateDetected && (bannedAthlete.banDateDetected || bannedAthlete.dateDetected)) {
              existingAthlete.banDateDetected = bannedAthlete.banDateDetected || bannedAthlete.dateDetected;
              updated = true;
            }
            
            if (!existingAthlete.banStatus && bannedAthlete.banStatus) {
              existingAthlete.banStatus = bannedAthlete.banStatus;
              updated = true;
            }
            
            if (updated) {
              await existingAthlete.save();
              totalUpdated++;
              console.log(`Updated ${existingAthlete.name} (${existingAthlete.country}) - ${bannedAthlete.banStatus || 'banned'}`);
            }
          } else {
            // Create new athlete
            const updateData = {
              isBanned: bannedAthlete.isBanned || false,
              isProvisionallyBanned: bannedAthlete.isProvisionallyBanned || false,
              banReason: bannedAthlete.banReason || bannedAthlete.reason,
              banSource: bannedAthlete.banSource || bannedAthlete.source,
              banAgency: bannedAthlete.banAgency || bannedAthlete.agency,
              banType: bannedAthlete.banType,
              banDateDetected: bannedAthlete.banDateDetected || bannedAthlete.dateDetected,
              banStatus: bannedAthlete.banStatus || 'cleared'
            };
            
            const newAthlete = new Athlete({
              name: bannedAthlete.name,
              country: bannedAthlete.country,
              gender: 'Female', // Default to Female, will be updated when we have more data
              ...updateData
            });
            
            await newAthlete.save();
            totalAdded++;
            console.log(`Added ${newAthlete.name} (${newAthlete.country}) - ${bannedAthlete.banStatus || 'banned'}`);
          }
        } catch (error) {
          console.error(`Error processing ${bannedAthlete.name}:`, error.message);
          errors.push(`Failed to process ${bannedAthlete.name}: ${error.message}`);
        }
      }
      
      const summary = {
        totalResults: allAiuAthletes.length,
        processedResults: allAiuAthletes.length - errors.length,
        newAthletes: totalAdded,
        updatedBanStatus: totalUpdated,
        errors: errors,
        totalBannedAthletes: totalAdded + totalUpdated
      };
      
      console.log(`AIU population complete: ${totalAdded} added, ${totalUpdated} updated, ${errors.length} errors`);
      return summary;
      
    } catch (error) {
      console.error('Error populating AIU athletes:', error);
      throw error;
    }
  }
}

module.exports = BannedAthleteService;
*/

'use strict';
// Deprecated wrapper: export the new implementation to maintain backward compatibility.
const BannedAthleteService2 = require('./bannedAthleteService2');
class BannedAthleteService extends BannedAthleteService2 {}
module.exports = BannedAthleteService;
