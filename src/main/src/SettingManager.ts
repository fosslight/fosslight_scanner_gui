import fs from 'fs';

const settingManager = {
  // writeSetting: (setting: Setting): boolean => {
  //   let success = false;
  //   fs.writeFile(filePath, JSON.stringify(settings, null, 2), (err) => {
  //     if (err) {
  //       console.error('Error saving settings:', err);
  //     } else {
  //       console.log('Settings saved successfully to', filePath);
  //     }
  //   });
  //   return success;
  // },
  // readSetting: (): Setting => {}
};

export default settingManager;
