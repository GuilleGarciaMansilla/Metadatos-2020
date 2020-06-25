package com.metadatos.imagenes;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thebuzzmedia.exiftool.ExifTool;
import com.thebuzzmedia.exiftool.core.StandardTag;
import com.thebuzzmedia.exiftool.ExifToolBuilder;
import com.thebuzzmedia.exiftool.Tag;
import java.io.File;
import java.nio.file.Files;
import java.util.Map;
import static java.util.Arrays.asList;
import java.util.HashMap;
import java.io.*;


@RestController
public class AplicationController {

	@RequestMapping("/hola")
	String raiz() {
		return "Bienvenido!!!";
	}
	

	
	@RequestMapping(value="/metadatos/mostrar",method = RequestMethod.POST,consumes = "multipart/form-data", produces ="application/json")
	public ResponseEntity<String> leerMetadatos(@RequestParam("file") MultipartFile file) throws Exception {
		return new ResponseEntity<>(mostrarMetadatos(file), 
				   HttpStatus.OK);
	}
	
	private String mostrarMetadatos(MultipartFile file) throws Exception {
		File multToFile =convertToFile(file);
		Map<Tag, String> meta =process(multToFile, null);
		Map<Tag, String> metaNuevo = new HashMap<>();
		for (Map.Entry<Tag, String> entry : meta.entrySet()) {
			   if(entry.getValue()!=null && !entry.getValue().isEmpty() || !entry.getValue().equals("0")) {
				   System.out.println("clave=" + entry.getKey() + ", valor=" + entry.getValue());
			   	   metaNuevo.put(entry.getKey(), entry.getValue());
				}
		}
		ObjectMapper objectMapper = new ObjectMapper();
	    String metadatos = objectMapper.writeValueAsString(metaNuevo);
		return metadatos;
	}
		
	
	@RequestMapping(value="/metadatos/eliminar",method = RequestMethod.POST,consumes = "multipart/form-data")
	
	public ResponseEntity<byte[]> eliminarMetadatos(@RequestParam("file") MultipartFile file) throws Exception {
		File fileNuevo =removeMetadata(file);
		byte[] fileContent = Files.readAllBytes(fileNuevo.toPath());
		if (fileContent!=null)
			return new ResponseEntity<byte[]>(fileContent, 
				   HttpStatus.OK);
		else
			return new ResponseEntity<>(null, 
					   HttpStatus.INTERNAL_SERVER_ERROR);
			
	}
	

	public File removeMetadata(MultipartFile file)
			   throws Exception {
	   File fileMetadataRemoved =convertToFile(file);
	   Map<Tag, String> metalectura =process(fileMetadataRemoved, null);
	   Map<Tag, String> meta = new HashMap<>();
	   for (Map.Entry<Tag, String> entry : metalectura.entrySet()) {
		   if(entry.getValue()!=null && !entry.getValue().isEmpty() || !entry.getValue().equals("0"))
		    System.out.println("clave=" + entry.getKey() + ", valor=" + entry.getValue());
		   	meta.put(entry.getKey(), "0");
	   }
       
      /* meta.put(StandardTag.TITLE, "0");
       meta.put(StandardTag.COPYRIGHT, "0");
       meta.put(StandardTag.ISO, "0");
       meta.put(StandardTag.IMAGE_WIDTH, "0");
       meta.put(StandardTag.IMAGE_HEIGHT, "0");
       meta.put(StandardTag.EXIF_VERSION, "0");
       meta.put(StandardTag.GPS_LATITUDE, "0");
       meta.put(StandardTag.GPS_LONGITUDE, "0");
       meta.put(StandardTag.X_RESOLUTION, "0");
       meta.put(StandardTag.Y_RESOLUTION, "0");
       meta.put(StandardTag.TITLE, "0");
       meta.put(StandardTag.COPYRIGHT, "0");
       meta.put(StandardTag.ISO, "0");
       meta.put(StandardTag.IMAGE_WIDTH, "0");
       meta.put(StandardTag.IMAGE_HEIGHT, "0");
       meta.put(StandardTag.EXIF_VERSION, "0");
       meta.put(StandardTag.GPS_LATITUDE, "0");
       meta.put(StandardTag.GPS_LONGITUDE, "0");
       meta.put(StandardTag.X_RESOLUTION, "0");
       meta.put(StandardTag.Y_RESOLUTION, "0");
       meta.put(StandardTag.TITLE, "0");
       meta.put(StandardTag.COPYRIGHT, "0");
       meta.put(StandardTag.ISO, "0");
       meta.put(StandardTag.IMAGE_WIDTH, "0");
       meta.put(StandardTag.IMAGE_HEIGHT, "0");
       meta.put(StandardTag.EXIF_VERSION, "0");
       meta.put(StandardTag.GPS_LATITUDE, "0");
       meta.put(StandardTag.GPS_LONGITUDE, "0");
       meta.put(StandardTag.X_RESOLUTION, "0");
       meta.put(StandardTag.Y_RESOLUTION, "0");
       meta.put(StandardTag.TITLE, "0");
       meta.put(StandardTag.COPYRIGHT, "0");
       meta.put(StandardTag.ISO, "0");
       meta.put(StandardTag.IMAGE_WIDTH, "0");
       meta.put(StandardTag.IMAGE_HEIGHT, "0");
       meta.put(StandardTag.EXIF_VERSION, "0");
       meta.put(StandardTag.GPS_LATITUDE, "0");
       meta.put(StandardTag.GPS_LONGITUDE, "0");
       meta.put(StandardTag.ISO, "0");
       meta.put(StandardTag.APERTURE, "0");
       meta.put(StandardTag.WHITE_BALANCE, "0");
       meta.put(StandardTag.CONTRAST, "0");
       meta.put(StandardTag.SATURATION, "0");
       meta.put(StandardTag.SHARPNESS, "0");
       meta.put(StandardTag.SHUTTER_SPEED, "0");
       meta.put(StandardTag.DIGITAL_ZOOM_RATIO, "0");
       meta.put(StandardTag.IMAGE_WIDTH, "0");
       meta.put(StandardTag.IMAGE_HEIGHT, "0");
       meta.put(StandardTag.X_RESOLUTION, "0");
       meta.put(StandardTag.Y_RESOLUTION, "0");
       meta.put(StandardTag.FLASH, "0");
       meta.put(StandardTag.METERING_MODE, "0");
       meta.put(StandardTag.FOCAL_LENGTH, "0");
       meta.put(StandardTag.FOCAL_LENGTH_35MM, "0");
       meta.put(StandardTag.EXPOSURE_TIME, "0");
       meta.put(StandardTag.EXPOSURE_COMPENSATION, "0");
       meta.put(StandardTag.EXPOSURE_PROGRAM, "0");
       meta.put(StandardTag.ORIENTATION, "0");
       meta.put(StandardTag.COLOR_SPACE, "0");
       meta.put(StandardTag.SENSING_METHOD, "0");
	   meta.put(StandardTag.SOFTWARE, "0");
       meta.put(StandardTag.MAKE, "0");
       meta.put(StandardTag.MODEL, "0");
       meta.put(StandardTag.LENS_MAKE, "0");
       meta.put(StandardTag.LENS_MODEL, "0");
       meta.put(StandardTag.OWNER_NAME, "0");
       meta.put(StandardTag.TITLE, "0");
       meta.put(StandardTag.AUTHOR, "0");
       meta.put(StandardTag.SUBJECT, "0");
       meta.put(StandardTag.KEYWORDS, "0");
	   meta.put(StandardTag.COMMENT, "0");
       meta.put(StandardTag.RATING, "0");
       meta.put(StandardTag.RATING_PERCENT, "0");
       meta.put(StandardTag.DATE_TIME_ORIGINAL, "0");
       meta.put(StandardTag.CREATION_DATE, "0");
       meta.put(StandardTag.GPS_LATITUDE, "0");
       meta.put(StandardTag.GPS_LATITUDE_REF, "0");
       meta.put(StandardTag.GPS_LONGITUDE, "0");
       meta.put(StandardTag.GPS_LONGITUDE_REF, "0");
       meta.put(StandardTag.GPS_LATITUDE, "0");
	   meta.put(StandardTag.GPS_ALTITUDE_REF, "0");
       meta.put(StandardTag.GPS_SPEED, "0");
       meta.put(StandardTag.GPS_SPEED_REF, "0");
       meta.put(StandardTag.GPS_PROCESS_METHOD, "0");
	   meta.put(StandardTag.GPS_BEARING, "0");
       meta.put(StandardTag.GPS_BEARING_REF, "0");
       meta.put(StandardTag.GPS_TIMESTAMP, "0");
       meta.put(StandardTag.ROTATION, "0");
       meta.put(StandardTag.EXIF_VERSION, "0");
       meta.put(StandardTag.LENS_ID, "0");
       meta.put(StandardTag.COPYRIGHT, "0");
       meta.put(StandardTag.ARTIST, "0");
       meta.put(StandardTag.SUB_SEC_TIME_ORIGINAL, "0");
       meta.put(StandardTag.OBJECT_NAME, "0");
	   meta.put(StandardTag.CAPTION_ABSTRACT, "0");
       meta.put(StandardTag.CREATOR, "0");
       meta.put(StandardTag.IPTC_KEYWORDS, "0");
       meta.put(StandardTag.COPYRIGHT_NOTICE, "0");
       meta.put(StandardTag.FILE_TYPE, "0");
       meta.put(StandardTag.AVG_BITRATE, "0");
	   meta.put(StandardTag.MIME_TYPE, "0");*/
	   process(fileMetadataRemoved, meta);
	   return fileMetadataRemoved;
	 }

    public static Map<Tag, String> process(File image, Map<Tag, String> meta) throws Exception {

        try {
            ExifTool exifTool = new ExifToolBuilder().build();

            //Escritura de metadatos
            if(meta!=null){
                exifTool.setImageMeta(image, meta);
            }           

            //lee y retorna metadatos
            Map<Tag, String> metadatos = new HashMap<Tag, String>();
            metadatos =exifTool.getImageMeta(image, asList(
	                    StandardTag.ISO,
	                    StandardTag.APERTURE,
	                    StandardTag.WHITE_BALANCE,
	                    StandardTag.CONTRAST,
	                    StandardTag.SATURATION,
	                    StandardTag.SHARPNESS,
	                    StandardTag.SHUTTER_SPEED,
	                    StandardTag.DIGITAL_ZOOM_RATIO,
	                    StandardTag.IMAGE_WIDTH,
	                    StandardTag.IMAGE_HEIGHT,
	                    StandardTag.X_RESOLUTION,
	                    StandardTag.Y_RESOLUTION,
	                    StandardTag.FLASH,
	                    StandardTag.METERING_MODE,
	                    StandardTag.FOCAL_LENGTH,
	                    StandardTag.FOCAL_LENGTH_35MM,
	                    StandardTag.EXPOSURE_TIME,
	                    StandardTag.EXPOSURE_COMPENSATION,
	                    StandardTag.EXPOSURE_PROGRAM,
	                    StandardTag.ORIENTATION,
	                    StandardTag.COLOR_SPACE,
	                    StandardTag.SENSING_METHOD,
	                    StandardTag.SOFTWARE,
	                	StandardTag.MAKE,
	                	StandardTag.MODEL,
	                	StandardTag.LENS_MAKE,
	                	StandardTag.LENS_MODEL,
	                	StandardTag.OWNER_NAME,
	                	StandardTag.TITLE,
	                	StandardTag.AUTHOR,
	                	StandardTag.SUBJECT,
	                	StandardTag.KEYWORDS,
	                	StandardTag.COMMENT,
	                	StandardTag.RATING,
	                	StandardTag.RATING_PERCENT,
	                	StandardTag.DATE_TIME_ORIGINAL,
	                	StandardTag.CREATION_DATE,
	                	StandardTag.GPS_LATITUDE,
	                	StandardTag.GPS_LATITUDE_REF,
	                	StandardTag.GPS_LONGITUDE,
	                	StandardTag.GPS_LONGITUDE_REF,
	                	StandardTag.GPS_LATITUDE,
	                	StandardTag.GPS_ALTITUDE_REF,
	                	StandardTag.GPS_SPEED,
	                	StandardTag.GPS_SPEED_REF,
	                	StandardTag.GPS_PROCESS_METHOD,
	                	StandardTag.GPS_BEARING,
	                	StandardTag.GPS_BEARING_REF,
	                	StandardTag.GPS_TIMESTAMP,
	                	StandardTag.ROTATION,
	                	StandardTag.EXIF_VERSION,
	                	StandardTag.LENS_ID,
	                	StandardTag.COPYRIGHT,
	                	StandardTag.ARTIST,
	                	StandardTag.SUB_SEC_TIME_ORIGINAL,
	                	StandardTag.OBJECT_NAME,
	                	StandardTag.CAPTION_ABSTRACT,
	                	StandardTag.CREATOR,
	                	StandardTag.IPTC_KEYWORDS,
	                	StandardTag.COPYRIGHT_NOTICE,
	                	StandardTag.FILE_TYPE,
	                	StandardTag.AVG_BITRATE,
	                	StandardTag.MIME_TYPE
            ));
            return metadatos;
        } catch (Exception ex) {
            return null;
        }
    }
    
	private static File convertToFile(MultipartFile file) throws IOException 
	 {
		File convFile = new File(file.getOriginalFilename());
		convFile.createNewFile();
		FileOutputStream fos = new FileOutputStream(convFile);
		fos.write(file.getBytes());
		fos.close();
		return convFile;
	}
		
	
	
}

