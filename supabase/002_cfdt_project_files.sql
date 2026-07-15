insert into storage.buckets (id,name,public,file_size_limit)
values ('cfdt-project-files','cfdt-project-files',false,536870912)
on conflict (id) do update
set public=excluded.public,file_size_limit=excluded.file_size_limit;
