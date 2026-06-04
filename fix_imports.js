const fs = require('fs');

const filesToFix = [
  "D:\\code\\hehe\\BE-CDTN\\frontend\\src\\components\\modal\\blog\\ModalCreateBlog.jsx",
  "D:\\code\\hehe\\BE-CDTN\\frontend\\src\\components\\modal\\blog\\ModalUpdateBlog.jsx",
  "D:\\code\\hehe\\BE-CDTN\\frontend\\src\\page\\admin\\Blogs.jsx",
  "D:\\code\\hehe\\BE-CDTN\\frontend\\src\\page\\Blog\\BlogDetailPage.jsx",
  "D:\\code\\hehe\\BE-CDTN\\frontend\\src\\page\\Blog\\BlogsRelatedSection.jsx",
  "D:\\code\\hehe\\BE-CDTN\\frontend\\src\\page\\home\\MyStorySection.jsx"
];

let replacedCount = 0;
filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes('blogAPI')) {
      content = content.replace(/blogAPI/g, 'blogApi');
      fs.writeFileSync(file, content, 'utf-8');
      replacedCount++;
      console.log('Fixed ' + file);
    }
  }
});
console.log('Total fixed: ' + replacedCount);
