package com.init.formatos.dao;

import org.springframework.data.jpa.repository.JpaRepository;

import com.init.formatos.entities.Formato;

public interface FormatosDAO extends JpaRepository<Formato, String>{

}
