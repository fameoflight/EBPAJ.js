/*
 * Javascript for creating EBPAJ EPUB3 files.
 */
function EBPAJFixed() {
  const NS_OPF = "http://www.idpf.org/2007/opf";
  var parser = new DOMParser(), serializer = new XMLSerializer();
  var zip = new JSZip(), item;

  var mimetype = {
    path: "mimetype",
    content: "application/epub+zip",
    zip: function() {
      zip.file(this.path, this.content, {compression:"STORE"});
    }
  };
  var container_xml = {
    path: "META-INF/container.xml",
    content: '<?xml version="1.0"?>\n' +
      '<container\n' +
      ' version="1.0"\n' +
      ' xmlns="urn:oasis:names:tc:opendocument:xmlns:container"\n' +
      '>\n' +
      '<rootfiles>\n' +
      '<rootfile\n' +
      ' full-path="item/standard.opf"\n' +
      ' media-type="application/oebps-package+xml"\n' +
      '/>\n' +
      '</rootfiles>\n' +
      '</container>\n',
    zip: function() {
      zip.file(this.path, this.content);
    }
  };
  function XmlItem() {}
  XmlItem.prototype = {
    path: null,
    doc: null,
    zip: function() {
      item.file(this.path, serializer.serializeToString(this.doc));
    }
  };
  var standard_opf = Object.create(XmlItem.prototype, {
    path: {
      value: "standard.opf"
    },
    doc: {
      value: parser.parseFromString(
        '<?xml version="1.0" encoding="UTF-8"?>' +
          '<package xmlns="' + NS_OPF + '"' +
          ' version="3.0" xml:lang="ja"' +
          ' unique-identifier="unique-id"' +
          ' prefix="rendition: http://www.idpf.org/vocab/rendition/#">' +
          '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
          '<dc:title /><dc:identifier id="unique-id" />' +
          '<dc:language>ja</dc:language>' +
          '<meta property="dcterms:modified">' +
          (new Date()).toISOString().slice(0,-5) + "Z" + 
          '</meta>' +
          '<meta property="rendition:layout">pre-paginated</meta>' +
          '<meta property="rendition:spread">landscape</meta>' +
          '</metadata>' +
          '<manifest>' +
          '<item media-type="application/xhtml+xml"' +
          ' id="toc" href="navigation-documents.xhtml"' +
          ' properties="nav"/>' +
          '<item media-type="text/css"' +
          ' id="fixed-layout-jp" href="style/fixed-layout-jp.css"/>' +
          '</manifest>' +
          '<spine></spine>' +
          '</package>',
        "text/xml")
    },
    spine: {
      value: function() {
        return this.doc.getElementsByTagName("spine")[0];
      }
    },
    setTitle: {
      value: function(title) {
        this.doc.getElementsByTagName("dc:title")[0].textContent = title;
      }
    },
    setID: {
      value: function(id) {
        this.doc.getElementsByTagName("dc:identifier")[0].textContent = id;
      }
    },
    setPageProgressionDirection: {
      value: function(direction) {
        this.spine().setAttribute("page-progression-direction", direction);
      }
    },
    setCover: {
      value: function(filename, type) {
        var doc = this.doc;
        var manifest = doc.getElementsByTagName("manifest")[0];
        var itemi = doc.createElementNS(NS_OPF, "item");
        var itemp = doc.createElementNS(NS_OPF, "item");
        var itemref = doc.createElementNS(NS_OPF, "itemref");
        itemi.setAttribute("media-type", type);
        itemi.setAttribute("id", "cover");
        itemi.setAttribute("href", "image/" + filename);
        itemi.setAttribute("properties", "cover-image");
        itemp.setAttribute("media-type", "application/xhtml+xml");
        itemp.setAttribute("id", "p-cover");
        itemp.setAttribute("href", "xhtml/p-cover.xhtml");
        itemp.setAttribute("properties", "svg");
        itemref.setAttribute("linear", "yes");
        itemref.setAttribute("idref", "p-cover");
        itemref.setAttribute("properties", "rendition:page-spread-center");
        manifest.appendChild(itemi);
        manifest.appendChild(itemp);
        this.pcover = itemp;
        this.spine().appendChild(itemref);
      }
    },
    addPage: {
      value: function(id, filename, type, prop) {
        var doc = this.doc;
        var manifest = doc.getElementsByTagName("manifest")[0];
        var itemi = doc.createElementNS(NS_OPF, "item");
        var itemp = doc.createElementNS(NS_OPF, "item");
        var itemref = doc.createElementNS(NS_OPF, "itemref");
        itemi.setAttribute("media-type", type);
        itemi.setAttribute("id", "i-" + id);
        itemi.setAttribute("href", "image/" + filename);
        itemp.setAttribute("media-type", "application/xhtml+xml");
        itemp.setAttribute("id", "p-" + id);
        itemp.setAttribute("href", "xhtml/p-" + id + ".xhtml");
        itemp.setAttribute("properties", "svg");
        itemref.setAttribute("linear", "yes");
        itemref.setAttribute("idref", "p-" + id);
        itemref.setAttribute("properties", prop);
        manifest.insertBefore(itemi, this.pcover);
        manifest.appendChild(itemp);
        this.spine().appendChild(itemref);
      }
    }
  });
  var nav_xhtml = Object.create(XmlItem.prototype, {
    path: {
      value: "navigation-documents.xhtml"
    },
    doc: {
      value: parser.parseFromString(
        '<?xml version="1.0" encoding="UTF-8"?>' +
          '<!DOCTYPE html>' +
          '<html xmlns="http://www.w3.org/1999/xhtml"' +
          ' xmlns:epub="http://www.idpf.org/2007/ops"' +
          ' lang="ja" xml:lang="ja">' +
          '<head>' +
          '<meta charset="UTF-8"/><title>目次</title>' +
          '</head>' +
          '<body><nav epub:type="toc" id="toc">' +
          '<h1>目次</h1>' +
          '<ol></ol>' +
          '</nav></body>' +
          '</html>',
        "application/xhtml+xml")
    },
    addItem: {
      value: function(id, title) {
        var ol = this.doc.getElementsByTagName("ol")[0];
        var li = this.doc.createElement("li");
        var a = this.doc.createElement("a");
        a.href = "xhtml/p-" + id + ".xhtml";
        a.textContent = title;
        li.appendChild(a);
        ol.appendChild(li);
      }
    }
  });
  var fixedLayoutJp_css = {
    path: "style/fixed-layout-jp.css",
    content: '@charset "UTF-8";\n\n' +
      'html,body {\n' +
      '  margin:    0;\n' +
      '  padding:   0;\n' +
      '  font-size: 0;\n' +
      '}\n' +
      'svg {\n' +
      '  margin:    0;\n' +
      '  padding:   0;\n' +
      '}\n',
    zip: function() {
      item.file(this.path, this.content);
    }
  };

  function zipPageXhtml(title, width, height, id, filename, iscover) {
    var path = "xhtml/p-" + id + ".xhtml";
    var content = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<!DOCTYPE html>' +
      '<html xmlns="http://www.w3.org/1999/xhtml"' +
      ' xmlns:epub="http://www.idpf.org/2007/ops"' +
      ' xml:lang="ja">' +
      '<head>' +
      '<meta charset="UTF-8"/><title>' + title + '</title>' +
      '<link rel="stylesheet" type="text/css"' +
      ' href="../style/fixed-layout-jp.css"/>' +
      '<meta name="viewport"' +
      ' content="width=' + width + ', height=' + height + '"/>' +
      '</head>' +
      '<body' + (iscover ? ' epub:type="cover"' : '') + '>' +
      '<div class="main">' +
      '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"' +
      ' xmlns:xlink="http://www.w3.org/1999/xlink"' +
      ' width="100%" height="100%"' +
      ' viewBox="0 0 ' + width + ' ' + height + '">' +
      '<image width="' + width + '" height="' + height + '"' +
      ' xlink:href="../image/' + filename + '"/>' +
      '</svg>' +
      '</div></body>' +
      '</html>';

    item.file(path, content);
  }
  function zipImage(filename, data) {
    item.file("image/" + filename, data, {compression:"STORE"});
  }

  this.setTitle = function(title) {
    this.title = title;
    standard_opf.setTitle(title);
  };
  this.setID = function(id) {
    standard_opf.setID(id);
  };
  this.setPageDirection = function(direction) {
    standard_opf.setPageProgressionDirection(direction);
  };
  this.setCover = function(type, filename) {
    standard_opf.setCover(type, filename);
  };
  this.registerPage = function(id, filename, type, prop) {
    standard_opf.addPage(id, filename, type, prop);
  };
  this.addNavItem = function(id, title) {
    nav_xhtml.addItem(id, title);
  };
  this.putCommonFiles = function() {
    standard_opf.zip();
    nav_xhtml.zip();
    fixedLayoutJp_css.zip();
  };
  this.setImageDim = function(width, height) {
    this.imgWidth = width;
    this.imgHeight = height;
  };
  this.putCoverImage = function(filename, imgBlob) {
    this.putImage("cover", filename, imgBlob);
  };
  this.putImage = function(id, filename, imgBlob) {
    zipPageXhtml(
      this.title, this.imgWidth, this.imgHeight, id, filename, false);
    zipImage(filename, imgBlob);
  };
  this.generate = function(func) {
    zip.generateAsync({type: "blob"}).then(func);
  };

  mimetype.zip();
  container_xml.zip();
  item = zip.folder("item");
}
