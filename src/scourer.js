var fs = require('fs'),
    readline = require('readline'),
    path = require('path');

var LINQOData = require('./LINQOData').LINQOData;

exports.getODataProviders = function(directory)
{
    var filesProvidingOData = [];
    var classExtensionMapping = [];

    files = fs.readdirSync( directory );
    files.forEach( function( file, index )
    {
        fileContent = fs.readFileSync(directory+file);
        //const re = /class (.*) extends (\w+)/gm;

        //while ((m = re.exec(fileContent)) !== null) {
        //    let classMapping = { [m[1]] : m[2] };
        //    classExtensionMapping.push(classMapping);
        //}

        if( fileContent.includes("extends ODataProvider") )
        {
            filesProvidingOData.push(path.resolve(directory+file.replace(".js","")));
        }
    });

    //console.log(classExtensionMapping);

    return filesProvidingOData;
}

exports.substituteInFilter = function(directory, filesProvidingOData)
{
    files = fs.readdirSync( directory );
    var newFiles = [];
    files.forEach( function( file, index )
    {
        readLines(file);
    });

    function readLines(file)
    {
        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream(directory+file)
        });

        var newFile = "";
        var replacementToOccur = false;

        lineReader.on('line', function (line)
                      {
                          handleLine(line);
        })
        .on('close', function()
        {
            lineReader.close()
            console.log( newFile );
        });

        function handleLine(line)
        {
            if( !replacementToOccur && line.includes("require") )
            {
                var re = /.*require\(\"(.+)\"\);/g;
                var matches = re.exec(line);
                if(matches.length > 0)
                {
                    var resolvedImport = path.resolve(directory, matches[1]);
                    for(provider in filesProvidingOData)
                    {
                        if( resolvedImport === filesProvidingOData[provider])
                        {
                            replacementToOccur = true;
                        }
                    }
                }
            }
            else if ( replacementToOccur && line.includes(".Where(") )
            {
                var re = /(.*)\.Where\((.+)\);/g;
                var matches = re.exec(line);
                if(matches.length > 0)
                {
                    var whereResult = LINQOData.Where(matches[2]);
                    var newFilter = ".filter(\"" + whereResult + "\");";
                    line = matches[1] + newFilter;
                }
            }
            newFile += line + "\r\n";
        }
    }
}
