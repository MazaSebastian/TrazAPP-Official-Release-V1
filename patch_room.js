const fs = require('fs');
const file = 'src/pages/RoomDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

const cssOverride = `\n  .notes-header-container {
      justify-content: flex-start !important;
  }
  
  .notes-title {
      margin: 0 !important;
  }
  
  @media (max-width: 768px) {
      .notes-header-container {
          justify-content: center !important;
      }
      .notes-title {
          margin: 0 auto !important;
      }
  }\n\n`;

content = content.replace("const Container = styled.div`", "const Container = styled.div`" + cssOverride);

fs.writeFileSync(file, content, 'utf8');
console.log('RoomDetail patched');
