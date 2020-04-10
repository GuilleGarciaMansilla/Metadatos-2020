package com.init.formatos.rest;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.init.formatos.dao.FormatosDAO;
import com.init.formatos.entities.Formato;

@RestController
@RequestMapping("/formatos")
public class formatosREST {

	@Autowired  
	private FormatosDAO formatoDAO;
	
	
	@GetMapping
	public List<Formato> getFormatos(){
		return formatoDAO.findAll();
	}
	
	@RequestMapping(value = "{nombreFormato}")
	public ResponseEntity<Formato> getFormato(@PathVariable("nombreFormato") String nombre){
		//Optional nos protege de valores null de vuelta
		Optional<Formato> optionalFormato = formatoDAO.findById(nombre);
		
		if(optionalFormato.isPresent())
			return ResponseEntity.ok(optionalFormato.get());
		else 
			return ResponseEntity.noContent().build();
		
	}
	
	@PostMapping
	public ResponseEntity<Formato> crearFormato(@RequestBody final Formato formato){
		return ResponseEntity.ok(formatoDAO.save(formato));
	}
	
	@DeleteMapping(value = "{nombreFormato}")
	public ResponseEntity<Void> borrarFormato(@PathVariable("nombreFormato") String nombre){
		formatoDAO.deleteById(nombre);
		return ResponseEntity.ok(null);
	}
	
	@PutMapping
	public ResponseEntity<Formato> actualizaFormato(@RequestBody final Formato formato){
		//Optional nos protege de valores null de vuelta
		Optional<Formato> optionalFormato = formatoDAO.findById(formato.getNombre());
		
		if(optionalFormato.isPresent()) {
			Formato formatoModificado = optionalFormato.get();
			formatoModificado.setNombre(formato.getNombre());
			formatoModificado.setUrl(formato.getUrl());
			formatoDAO.save(formatoModificado);
			return ResponseEntity.ok(formatoModificado);
		}
			
		else 
			return ResponseEntity.notFound().build();
		
	}
	
}
