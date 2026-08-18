const fs = require('fs')
const path = require('path')

/**
 * Функция для создания списка ассетов и сохранения его в виде JS-файла.
 * @param {string} src - Путь к директории с файлами.
 * @param {string} listName - Имя переменной для создаваемого списка.
 * @param {string} filename - Имя выходного файла (без расширения).
 * @param {boolean} toBase64 - Флаг для конвертации файлов в Base64.
 */
async function createList(src, listName, filename, toBase64) {
  console.log('create assets list:', src)
  const list = []
  
  // Читаем файлы из указанной директории и добавляем их в список
  await readDirs(src, list, toBase64)
  
  // Генерируем строку для JS-файла, который экспортирует список
  const output = `
    export const ${listName} = ${JSON.stringify(list)}
    window.${listName} = ${listName}
  `
  
  // Записываем результат в файл по указанному пути
  fs.writeFileSync(path.resolve(__dirname, '..', 'src', 'game', 'generatedAssets', filename + '.js'), output)
}

/**
 * Рекурсивная функция для чтения файлов из директории и добавления их в список.
 * @param {string} dir - Текущая директория для чтения.
 * @param {Array} list - Список, в который добавляются файлы.
 * @param {boolean} toBase64 - Флаг для конвертации файлов в Base64.
 */
async function readDirs(dir, list, toBase64) {
  console.log('readDirs', dir)
  // Определяем абсолютный путь к директории
  const dirPath = path.resolve(__dirname, '..', 'public', ...dir.split('/'))
  
  // Получаем список файлов и папок в текущей директории
  const files = fs.readdirSync(dirPath)
  
  for (const file of files) {
    const filePath = path.resolve(dirPath, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isFile()) {
      // Проверяем, является ли файл изображением или аудио
      if (!(/\.jpg|\.png|\.wav|\.mp3/).test(path.extname(filePath))) continue
      
      let prefix = dir
      prefix = prefix.split(dir).join('')
      
      // // Обработка изображений (jpg, png)
      // if ((/\.jpg|\.png/).test(path.extname(filePath))) {
      //   const src = !toBase64 ? dir + '/' + file : await imageToBase64(filePath)
      //   list.push({alias: prefix + file.split('.')[0], src})
      // }
      //
      // // Обработка аудио (wav, mp3)
      // else if ((/\.wav|\.mp3/).test(path.extname(filePath))) {
      //   const src = !toBase64 ? dir + '/' + file : await audioToBase64(filePath)
      //   list.push({alias: prefix + file.split('.')[0], src})
      // }
    }
    
    // Если текущий элемент — директория, вызываем функцию рекурсивно
    if (stat.isDirectory()) {
      await readDirs(dir + '/' + file, list, toBase64)
    }
  }
}

module.exports = {createList}
